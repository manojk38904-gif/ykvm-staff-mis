import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;
  const role = user.role;

  if (role === "STAFF") {
    const staffProfile = await prisma.staffProfile.findUnique({
      where: { userId: user.id },
    });

    if (!staffProfile) {
      return NextResponse.json({ payrolls: [] });
    }

    const payrolls = await prisma.payroll.findMany({
      where: { staffId: staffProfile.id },
      include: { salaryPayments: true },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return NextResponse.json({ payrolls });
  }

  if (role === "ADMIN" || role === "SUB_ADMIN") {
    const payrolls = await prisma.payroll.findMany({
      include: {
        staff: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        salaryPayments: true,
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return NextResponse.json({ payrolls });
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { staffId, month, year, gross, deductions, presentDays, paidLeaveDays, unpaidLeaveDays } = body;

  if (!staffId || !month || !year || gross === undefined || deductions === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const net = parseFloat(gross) - parseFloat(deductions);

  const payroll = await prisma.payroll.create({
    data: {
      staffId,
      month: parseInt(month),
      year: parseInt(year),
      gross: parseFloat(gross),
      deductions: parseFloat(deductions),
      net,
      presentDays: parseInt(presentDays) || 0,
      paidLeaveDays: parseInt(paidLeaveDays) || 0,
      unpaidLeaveDays: parseInt(unpaidLeaveDays) || 0,
      status: "GENERATED",
    },
  });

  return NextResponse.json({ message: "Payroll generated successfully", payroll });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { payrollId, method, referenceNo } = body;

  if (!payrollId || !method || !referenceNo) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const payroll = await prisma.payroll.findUnique({ where: { id: payrollId } });
  if (!payroll) {
    return NextResponse.json({ error: "Payroll not found" }, { status: 404 });
  }

  await prisma.payroll.update({
    where: { id: payrollId },
    data: { status: "PAID" },
  });

  await prisma.salaryPayment.create({
    data: {
      payrollId,
      method,
      referenceNo,
    },
  });

  return NextResponse.json({ message: "Payroll marked as paid successfully" });
}
