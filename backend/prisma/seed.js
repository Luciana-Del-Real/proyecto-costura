import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Check if admin exists
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@costura.app';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists');
  } else {
    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
        active: true,
      },
    });

    console.log(`✅ Admin user created: ${admin.email}`);
  }

  console.log('🌱 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
