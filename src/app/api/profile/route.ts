import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { staff: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await req.json();
  const { name, phone, designation, department, bankName, accountNumber, ifscCode } = body;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: name ?? undefined,
      phone: phone ?? undefined,
    },
  });

  const staffProfile = await prisma.staffProfile.upsert({
    where: { userId },
    create: {
      userId,
      designation: designation ?? null,
      department: department ?? null,
      bankName: bankName ?? null,
      accountNumber: accountNumber ?? null,
      ifscCode: ifscCode ?? null,
    },
    update: {
      designation: designation ?? undefined,
      department: department ?? undefined,
      bankName: bankName ?? undefined,
      accountNumber: accountNumber ?? undefined,
      ifscCode: ifscCode ?? undefined,
    },
  });

  return NextResponse.json({
    user: {
      ...updatedUser,
      staff: staffProfile,
    },
  });
}
