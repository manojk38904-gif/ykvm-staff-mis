import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create default admin user if not exists
  const adminEmail = 'admin@ykvm.local'
  const existing = await prisma.user.findFirst({ where: { email: adminEmail } })
  if (!existing) {
    const hashed = await bcrypt.hash('admin123', 10)
    const admin = await prisma.user.create({
      data: {
        name: 'Admin',
        email: adminEmail,
        password: hashed,
        role: UserRole.ADMIN,
      },
    })
    // Create a staff profile for admin to satisfy relations
    await prisma.staffProfile.create({
      data: {
        userId: admin.id,
        designation: 'System Administrator',
        department: 'IT',
        joiningDate: new Date(),
        salary: 0,
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        status: 'Active',
      },
    })
    console.log('Default admin user created: admin@ykvm.local / admin123')
  } else {
    console.log('Admin user already exists')
  }

  // Create a default office location
  const offices = await prisma.officeLocation.findMany()
  if (offices.length === 0) {
    await prisma.officeLocation.create({
      data: {
        name: 'YKVM Office (Placeholder)',
        lat: 26.8467,
        lng: 80.9462,
        radiusMeters: 10,
        active: true,
      },
    })
    console.log('Default office location created')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })