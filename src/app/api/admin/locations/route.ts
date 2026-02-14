import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    !["ADMIN", "SUB_ADMIN"].includes((session.user as any).role)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const locations = await prisma.officeLocation.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ locations });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    !["ADMIN", "SUB_ADMIN"].includes((session.user as any).role)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, lat, lng, radiusMeters } = body;

  if (!name || lat === undefined || lng === undefined) {
    return NextResponse.json(
      { error: "Name, latitude, and longitude are required" },
      { status: 400 }
    );
  }

  const location = await prisma.officeLocation.create({
    data: {
      name,
      lat,
      lng,
      radiusMeters: radiusMeters || 10,
    },
  });

  return NextResponse.json({
    message: "Location created successfully",
    id: location.id,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    !["ADMIN", "SUB_ADMIN"].includes((session.user as any).role)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, name, lat, lng, radiusMeters, active } = body;

  if (!id) {
    return NextResponse.json(
      { error: "Location ID is required" },
      { status: 400 }
    );
  }

  const existing = await prisma.officeLocation.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Location not found" },
      { status: 404 }
    );
  }

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (lat !== undefined) updateData.lat = lat;
  if (lng !== undefined) updateData.lng = lng;
  if (radiusMeters !== undefined) updateData.radiusMeters = radiusMeters;
  if (active !== undefined) updateData.active = active;

  await prisma.officeLocation.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ message: "Location updated successfully" });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Location ID is required" },
      { status: 400 }
    );
  }

  const existing = await prisma.officeLocation.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Location not found" },
      { status: 404 }
    );
  }

  await prisma.officeLocation.delete({ where: { id } });

  return NextResponse.json({ message: "Location deleted successfully" });
}
