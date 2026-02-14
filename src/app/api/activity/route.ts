import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { LocalStorageAdapter } from '@/lib/storage'

// GET /api/activity?fieldTripId=... - list activities for trip
export async function GET(req: NextRequest) {
  const session = await getServerSession({ req, ...authOptions })
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const fieldTripId = searchParams.get('fieldTripId')
  const activities = await prisma.activity.findMany({
    where: fieldTripId ? { fieldTripId } : undefined,
    include: { photos: true, attendanceSheet: true, proceeding: true },
  })
  return NextResponse.json({ activities })
}

// POST /api/activity - create activity with photos and attendance sheet
export async function POST(req: NextRequest) {
  const session = await getServerSession({ req, ...authOptions })
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const { fieldTripId, title, description, villageName, time, gpsRequired, photos, attendanceSheet } = body
  if (!fieldTripId || !title || !photos || photos.length < 1) {
    return NextResponse.json({ error: 'Missing parameters or insufficient photos' }, { status: 400 })
  }
  // Save photos
  const storage = new LocalStorageAdapter()
  const photoRecords = []
  for (const photo of photos) {
    const match = /^data:image\/(png|jpeg);base64,(.+)$/.exec(photo.data)
    if (!match) continue
    const ext = match[1] === 'jpeg' ? 'jpg' : match[1]
    const buffer = Buffer.from(match[2], 'base64')
    const filename = `${Date.now()}_${Math.random().toString(16).slice(2)}.${ext}`
    const path = await storage.saveFile(buffer, 'activity_photos', filename)
    photoRecords.push({ file: path, lat: photo.lat ?? null, lng: photo.lng ?? null })
  }
  // Save attendance sheet if provided
  let attendanceSheetPath: string | undefined
  if (attendanceSheet) {
    const match2 = /^data:image\/(png|jpeg);base64,(.+)$/.exec(attendanceSheet)
    if (match2) {
      const ext = match2[1] === 'jpeg' ? 'jpg' : match2[1]
      const buffer = Buffer.from(match2[2], 'base64')
      const filename = `${Date.now()}_sheet.${ext}`
      attendanceSheetPath = await storage.saveFile(buffer, 'attendance_sheets', filename)
    }
  }
  const activity = await prisma.activity.create({
    data: {
      fieldTripId,
      title,
      description: description || '',
      villageName: villageName || '',
      time: time ? new Date(time) : new Date(),
      gpsRequired: gpsRequired || false,
      photos: {
        create: photoRecords.map((p) => ({ file: p.file, lat: p.lat, lng: p.lng })),
      },
      attendanceSheet: attendanceSheetPath
        ? {
            create: { file: attendanceSheetPath },
          }
        : undefined,
    },
    include: { photos: true, attendanceSheet: true },
  })
  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      actionType: 'ACTIVITY_CREATE',
      entityType: 'Activity',
      entityId: activity.id,
      metaJson: {},
    },
  })
  return NextResponse.json({ message: 'Activity created', id: activity.id })
}