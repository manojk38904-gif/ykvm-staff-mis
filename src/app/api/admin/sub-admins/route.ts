import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subAdmins = await prisma.user.findMany({
    where: { role: "SUB_ADMIN" },
    select: {
      id: true,
      name: true,
      email: true,
      googleId: true,
      image: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ subAdmins });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, email, password } = body;

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 });
  }

  const hashedPassword = password ? await bcrypt.hash(password, 10) : "";

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "SUB_ADMIN",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: (session.user as any).id,
      actionType: "SUB_ADMIN_CREATE",
      entityType: "User",
      entityId: newUser.id,
      metaJson: { name, email },
    },
  });

  return NextResponse.json({ message: "Sub-Admin created successfully", id: newUser.id });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("id");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "SUB_ADMIN") {
    return NextResponse.json({ error: "Sub-Admin not found" }, { status: 404 });
  }

  await prisma.user.delete({ where: { id: userId } });

  await prisma.auditLog.create({
    data: {
      userId: (session.user as any).id,
      actionType: "SUB_ADMIN_DELETE",
      entityType: "User",
      entityId: userId,
      metaJson: { name: user.name, email: user.email },
    },
  });

  return NextResponse.json({ message: "Sub-Admin removed successfully" });
}
