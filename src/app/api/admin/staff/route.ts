import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "SUB_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const staff = await prisma.user.findMany({
    where: { role: "STAFF" },
    include: {
      staff: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ staff });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "SUB_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, email, phone, password, designation, department, salary, joiningDate } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 });
  }

  if (phone) {
    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      return NextResponse.json({ error: "A user with this phone number already exists" }, { status: 400 });
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      password: hashedPassword,
      role: "STAFF",
      staff: {
        create: {
          designation: designation || null,
          department: department || null,
          salary: salary ? parseFloat(salary) : null,
          joiningDate: joiningDate ? new Date(joiningDate) : null,
          status: "Active",
        },
      },
    },
  });

  return NextResponse.json({ message: "Staff enrolled successfully", id: newUser.id });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "SUB_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { userId, name, phone, designation, department, salary, status } = body;

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "STAFF") {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: name || user.name,
      phone: phone !== undefined ? (phone || null) : user.phone,
    },
  });

  await prisma.staffProfile.upsert({
    where: { userId },
    create: {
      userId,
      designation: designation || null,
      department: department || null,
      salary: salary ? parseFloat(salary) : null,
      status: status || "Active",
    },
    update: {
      ...(designation !== undefined && { designation: designation || null }),
      ...(department !== undefined && { department: department || null }),
      ...(salary !== undefined && { salary: salary ? parseFloat(salary) : null }),
      ...(status !== undefined && { status: status || null }),
    },
  });

  return NextResponse.json({ message: "Staff updated successfully" });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Only ADMIN can delete staff" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("id");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "STAFF") {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }

  await prisma.staffProfile.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ message: "Staff member deleted successfully" });
}
