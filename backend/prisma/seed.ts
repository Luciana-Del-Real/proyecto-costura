import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Admin credentials MUST come from the environment — no hardcoded fallbacks ship in source.
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME;

  if (!adminEmail || !adminPassword || !adminName) {
    console.error(
      '❌ Seed requires ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_NAME environment variables. Refusing to proceed with a default admin.',
    );
    process.exit(1);
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists. Updating name and password...');
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    await prisma.user.update({
      where: { email: adminEmail },
      data: { name: adminName, password: hashedPassword, role: 'ADMIN', active: true }
    });
    console.log(`✅ Admin user updated: ${adminEmail}`);
  } else {
    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
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
