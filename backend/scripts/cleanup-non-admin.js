const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'daiana@grow.com';

  const admin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!admin) {
    throw new Error(`Admin no encontrado: ${adminEmail}`);
  }

  const purchasesDeleted = await prisma.purchase.deleteMany({});

  const usersDeleted = await prisma.user.deleteMany({
    where: {
      email: {
        not: adminEmail,
      },
    },
  });

  const remainingUsers = await prisma.user.findMany({
    select: { email: true, role: true },
    orderBy: { email: 'asc' },
  });

  const remainingPurchases = await prisma.purchase.count();

  console.log('✅ Limpieza completada');
  console.log(`- Ventas eliminadas: ${purchasesDeleted.count}`);
  console.log(`- Usuarios eliminados: ${usersDeleted.count}`);
  console.log(`- Usuarios restantes: ${remainingUsers.length}`);
  console.log(`- Ventas restantes: ${remainingPurchases}`);
  console.log('Usuarios restantes:', remainingUsers);
}

main()
  .catch((error) => {
    console.error('❌ Error en limpieza:', error.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });