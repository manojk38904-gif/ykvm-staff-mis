import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as any
    let leaves

    if (user.role === 'STAFF') {
      const staffProfile = await prisma.staffProfile.findUnique({
        where: { userId: user.id },
      })
      if (!staffProfile) {
        return NextResponse.json({ leaves: [] })
      }
      leaves = await prisma.leave.findMany({
        where: { staffId: staffProfile.id },
        include: {
          approvals: {
            include: { approver: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    } else if (user.role === 'ADMIN' || user.role === 'SUB_ADMIN') {
      leaves = await prisma.leave.findMany({
        include: {
          staff: {
            include: { user: { select: { name: true, email: true } } },
          },
          approvals: {
            include: { approver: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ leaves })
  } catch (error) {
    console.error('GET /api/leaves error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as any
    if (user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Only staff can apply for leave' }, { status: 403 })
    }

    const body = await req.json()
    const { type, fromDate, toDate, reason } = body

    if (!type || !fromDate || !toDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['PAID', 'UNPAID'].includes(type)) {
      return NextResponse.json({ error: 'Invalid leave type' }, { status: 400 })
    }

    const staffProfile = await prisma.staffProfile.findUnique({
      where: { userId: user.id },
    })

    if (!staffProfile) {
      return NextResponse.json({ error: 'Staff profile not found' }, { status: 404 })
    }

    const leave = await prisma.leave.create({
      data: {
        staffId: staffProfile.id,
        type: type as 'PAID' | 'UNPAID',
        fromDate: new Date(fromDate),
        toDate: new Date(toDate),
        reason: reason || null,
        status: 'PENDING',
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        actionType: 'LEAVE_APPLIED',
        entityType: 'Leave',
        entityId: leave.id,
        metaJson: { type, fromDate, toDate, reason },
      },
    })

    return NextResponse.json({ success: true, leave })
  } catch (error) {
    console.error('POST /api/leaves error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as any
    if (user.role !== 'ADMIN' && user.role !== 'SUB_ADMIN') {
      return NextResponse.json({ error: 'Only admins can approve/reject leaves' }, { status: 403 })
    }

    const body = await req.json()
    const { leaveId, decision, comment } = body

    if (!leaveId || !decision) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['APPROVED', 'REJECTED'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision' }, { status: 400 })
    }

    const leave = await prisma.leave.findUnique({ where: { id: leaveId } })
    if (!leave) {
      return NextResponse.json({ error: 'Leave not found' }, { status: 404 })
    }

    if (leave.status !== 'PENDING') {
      return NextResponse.json({ error: 'Leave is not pending' }, { status: 400 })
    }

    await prisma.leave.update({
      where: { id: leaveId },
      data: { status: decision as 'APPROVED' | 'REJECTED' },
    })

    await prisma.leaveApproval.create({
      data: {
        leaveId,
        level: 1,
        approverId: user.id,
        decision: decision as 'APPROVED' | 'REJECTED',
        comment: comment || null,
        decidedAt: new Date(),
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        actionType: `LEAVE_${decision}`,
        entityType: 'Leave',
        entityId: leaveId,
        metaJson: { decision, comment },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PATCH /api/leaves error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
