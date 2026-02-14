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
    let fieldTrips

    if (user.role === 'STAFF') {
      const staffProfile = await prisma.staffProfile.findUnique({
        where: { userId: user.id },
      })
      if (!staffProfile) {
        return NextResponse.json({ fieldTrips: [] })
      }
      fieldTrips = await prisma.fieldTrip.findMany({
        where: { staffId: staffProfile.id },
        include: {
          pings: true,
          activities: true,
        },
        orderBy: { startTime: 'desc' },
      })
    } else if (user.role === 'ADMIN' || user.role === 'SUB_ADMIN') {
      fieldTrips = await prisma.fieldTrip.findMany({
        include: {
          staff: {
            include: {
              user: {
                select: { name: true, email: true, image: true },
              },
            },
          },
          pings: true,
          activities: true,
        },
        orderBy: { startTime: 'desc' },
      })
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ fieldTrips })
  } catch (error) {
    console.error('GET /api/field-trips error:', error)
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
      return NextResponse.json({ error: 'Only staff can start field trips' }, { status: 403 })
    }

    const body = await req.json()
    const { startLat, startLng, startOdometer } = body

    if (startLat == null || startLng == null) {
      return NextResponse.json({ error: 'Start location is required' }, { status: 400 })
    }

    const staffProfile = await prisma.staffProfile.findUnique({
      where: { userId: user.id },
    })
    if (!staffProfile) {
      return NextResponse.json({ error: 'Staff profile not found' }, { status: 404 })
    }

    const ongoingTrip = await prisma.fieldTrip.findFirst({
      where: { staffId: staffProfile.id, status: 'ONGOING' },
    })
    if (ongoingTrip) {
      return NextResponse.json({ error: 'You already have an ongoing field trip' }, { status: 400 })
    }

    const fieldTrip = await prisma.fieldTrip.create({
      data: {
        staffId: staffProfile.id,
        startTime: new Date(),
        startLat: parseFloat(String(startLat)),
        startLng: parseFloat(String(startLng)),
        startOdometer: startOdometer != null ? parseFloat(String(startOdometer)) : null,
        status: 'ONGOING',
      },
    })

    return NextResponse.json({ fieldTrip }, { status: 201 })
  } catch (error) {
    console.error('POST /api/field-trips error:', error)
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
    if (user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Only staff can end field trips' }, { status: 403 })
    }

    const body = await req.json()
    const { fieldTripId, endLat, endLng, endOdometer } = body

    if (!fieldTripId) {
      return NextResponse.json({ error: 'Field trip ID is required' }, { status: 400 })
    }
    if (endLat == null || endLng == null) {
      return NextResponse.json({ error: 'End location is required' }, { status: 400 })
    }

    const staffProfile = await prisma.staffProfile.findUnique({
      where: { userId: user.id },
    })
    if (!staffProfile) {
      return NextResponse.json({ error: 'Staff profile not found' }, { status: 404 })
    }

    const trip = await prisma.fieldTrip.findFirst({
      where: { id: fieldTripId, staffId: staffProfile.id, status: 'ONGOING' },
    })
    if (!trip) {
      return NextResponse.json({ error: 'Ongoing field trip not found' }, { status: 404 })
    }

    let computedKm: number | null = null
    const endOdo = endOdometer != null ? parseFloat(String(endOdometer)) : null
    if (endOdo != null && trip.startOdometer != null) {
      computedKm = Math.max(0, endOdo - trip.startOdometer)
    }

    const fieldTrip = await prisma.fieldTrip.update({
      where: { id: fieldTripId },
      data: {
        endTime: new Date(),
        endLat: parseFloat(String(endLat)),
        endLng: parseFloat(String(endLng)),
        endOdometer: endOdo,
        computedKm,
        status: 'COMPLETED',
      },
    })

    return NextResponse.json({ fieldTrip })
  } catch (error) {
    console.error('PATCH /api/field-trips error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
