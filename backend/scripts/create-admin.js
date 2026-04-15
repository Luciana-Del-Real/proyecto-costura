const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

function parseArg(name, defaultValue) {
  const arg = process.argv.find((item) => item.startsWith(`--${name}=`));
  if (!arg) return defaultValue;
  return arg.split('=')[1];
}

async function main() {
  const email = parseArg('email', process.env.ADMIN_EMAIL || 'admin@costura.app');
  const password = parseArg('password', process.env.ADMIN_PASSWORD || 'Admin123!');
  const name = parseArg('name', 'Admin User');

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    console.log(`✅ Admin user already exists: ${existing.email}. Updating role/name/password if needed...`);
    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { email },
      data: {
        name,
        password: hashedPassword,
        role: 'ADMIN',
        active: true,
      },
    });
    console.log(`✅ Admin user updated: ${email}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const admin = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: 'ADMIN',
      active: true,
    },
  });

  console.log(`✅ Admin user created: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
