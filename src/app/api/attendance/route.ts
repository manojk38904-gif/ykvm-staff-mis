import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { haversineDistance } from '@/lib/geo'
import { LocalStorageAdapter } from '@/lib/storage'

// GET /api/attendance
export async function GET(req: NextRequest) {
  const session = await getServerSession({ req, ...authOptions })
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id
  const role = (session.user as any).role

  if (role === 'STAFF') {
    const staff = await prisma.staffProfile.findFirst({ where: { userId } })
    if (!staff) return NextResponse.json({ attendances: [] })
    const attendances = await prisma.attendance.findMany({
      where: { staffId: staff.id },
      orderBy: { datetime: 'desc' },
      take: 30,
    })
    return NextResponse.json({ attendances })
  } else {
    const attendances = await prisma.attendance.findMany({
      orderBy: { datetime: 'desc' },
      take: 50,
      include: { staff: { include: { user: { select: { name: true, email: true } } } } },
    })
    return NextResponse.json({ attendances })
  }
}

// POST /api/attendance
export async function POST(req: NextRequest) {
  const session = await getServerSession({ req, ...authOptions })
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if ((session.user as any).role !== 'STAFF') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json()
  const { selfie, lat, lng } = body
  if (!selfie || !lat || !lng) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }
  // Parse selfie data URL
  const match = /^data:image\/(png|jpeg);base64,(.+)$/.exec(selfie)
  if (!match) {
    return NextResponse.json({ error: 'Invalid selfie' }, { status: 400 })
  }
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1]
  const data = match[2]
  const buffer = Buffer.from(data, 'base64')
  // Determine active office (assume first active)
  const office = await prisma.officeLocation.findFirst({ where: { active: true } })
  if (!office) {
    return NextResponse.json({ error: 'Office not configured' }, { status: 500 })
  }
  const distance = haversineDistance(
    parseFloat(lat),
    parseFloat(lng),
    office.lat.toNumber(),
    office.lng.toNumber()
  )
  if (distance > office.radiusMeters) {
    return NextResponse.json({ error: 'Outside geofence', distance }, { status: 400 })
  }
  // Save selfie file using local storage
  const storage = new LocalStorageAdapter()
  const { filePath } = await storage.saveFile(buffer, ext)
  // Create attendance record
  const staff = await prisma.staffProfile.findFirst({ where: { userId: (session.user as any).id } })
  if (!staff) {
    return NextResponse.json({ error: 'Staff profile not found' }, { status: 404 })
  }
  await prisma.attendance.create({
    data: {
      staffId: staff.id,
      datetime: new Date(),
      selfieFile: filePath,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      distanceToOffice: distance,
      status: 'PRESENT',
      deviceInfo: req.headers.get('user-agent') || '',
    },
  })
  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: (session.user as any).id,
      actionType: 'ATTENDANCE_SUBMIT',
      entityType: 'Attendance',
      entityId: staff.id,
      metaJson: { distance },
    },
  })
  return NextResponse.json({ message: 'Attendance recorded', distance })
}