const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

function parseArg(name) {
  const arg = process.argv.find((item) => item.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : undefined;
}

async function main() {
  const email = parseArg('email') || process.env.ADMIN_EMAIL;
  const password = parseArg('password') || process.env.ADMIN_PASSWORD;
  const name = parseArg('name') || process.env.ADMIN_NAME;

  if (!email || !password || !name) {
    console.error(
      '❌ create-admin requires ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_NAME environment variables (or --email, --password, --name arguments). Refusing to create an admin with a default password.',
    );
    process.exit(1);
  }

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
