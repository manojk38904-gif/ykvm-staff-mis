import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = (session.user as any).role
  if (role !== 'ADMIN' && role !== 'SUB_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined
  const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
  const staffId = searchParams.get('staffId') || undefined

  if (!type || !['attendance', 'leaves', 'field-trips', 'payroll'].includes(type)) {
    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
  }

  try {
    let records: any[] = []

    if (type === 'attendance') {
      const where: any = {}
      if (staffId) where.staffId = staffId
      if (month && year) {
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0, 23, 59, 59)
        where.datetime = { gte: startDate, lte: endDate }
      } else if (year) {
        const startDate = new Date(year, 0, 1)
        const endDate = new Date(year, 11, 31, 23, 59, 59)
        where.datetime = { gte: startDate, lte: endDate }
      }
      records = await prisma.attendance.findMany({
        where,
        include: { staff: { include: { user: { select: { name: true, email: true } } } } },
        orderBy: { datetime: 'desc' },
      })
    } else if (type === 'leaves') {
      const where: any = {}
      if (staffId) where.staffId = staffId
      if (month && year) {
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0, 23, 59, 59)
        where.fromDate = { gte: startDate, lte: endDate }
      } else if (year) {
        const startDate = new Date(year, 0, 1)
        const endDate = new Date(year, 11, 31, 23, 59, 59)
        where.fromDate = { gte: startDate, lte: endDate }
      }
      records = await prisma.leave.findMany({
        where,
        include: {
          staff: { include: { user: { select: { name: true, email: true } } } },
          approvals: { include: { approver: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      })
    } else if (type === 'field-trips') {
      const where: any = {}
      if (staffId) where.staffId = staffId
      if (month && year) {
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0, 23, 59, 59)
        where.startTime = { gte: startDate, lte: endDate }
      } else if (year) {
        const startDate = new Date(year, 0, 1)
        const endDate = new Date(year, 11, 31, 23, 59, 59)
        where.startTime = { gte: startDate, lte: endDate }
      }
      records = await prisma.fieldTrip.findMany({
        where,
        include: { staff: { include: { user: { select: { name: true, email: true } } } } },
        orderBy: { startTime: 'desc' },
      })
    } else if (type === 'payroll') {
      const where: any = {}
      if (staffId) where.staffId = staffId
      if (month) where.month = month
      if (year) where.year = year
      records = await prisma.payroll.findMany({
        where,
        include: { staff: { include: { user: { select: { name: true, email: true } } } } },
        orderBy: { createdAt: 'desc' },
      })
    }

    return NextResponse.json({ records, type })
  } catch (error) {
    console.error('Reports API error:', error)
    return NextResponse.json({ error: 'Failed to fetch report data' }, { status: 500 })
  }
}
