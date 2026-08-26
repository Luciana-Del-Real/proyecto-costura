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

  // Patrones gratis (PDF). `titulo` no es @unique en el modelo, así que la
  // idempotencia se resuelve con findFirst + update/create en lugar de upsert.
  const patrones = [
    {
      titulo: 'Tote bag reversible',
      descripcion: 'Patrón en tamaño real para armar tu primer tote bag. Incluye guía de corte y costura paso a paso.',
      nivel: 'Principiante',
      categoria: 'Accesorios',
      archivo: '/patrones/tote-bag.pdf',
    },
    {
      titulo: 'Neceser con cremallera',
      descripcion: 'Patrón clásico de neceser con forrería y cremallera. Medidas y margen de costura incluidos.',
      nivel: 'Intermedio',
      categoria: 'Accesorios',
      archivo: '/patrones/neceser.pdf',
    },
    {
      titulo: 'Falda elástico',
      descripcion: 'Patrón de falda con cintura elástica, sin cremallera. Tallas S a XL con tabla de medidas.',
      nivel: 'Principiante',
      categoria: 'Indumentaria',
      archivo: '/patrones/falda-elastico.pdf',
    },
    {
      titulo: 'Delantal de cocina',
      descripcion: 'Delantal práctico con bolsillo frontal y tiras ajustables. Patrón en tamaño real listo para imprimir.',
      nivel: 'Principiante',
      categoria: 'Hogar',
      archivo: '/patrones/delantal.pdf',
    },
    {
      titulo: 'Funda de almohadón',
      descripcion: 'Funda de almohadón 40x40 con cierre escondido. Patrón simple con explicación de dobladillos.',
      nivel: 'Principiante',
      categoria: 'Hogar',
      archivo: '/patrones/funda-almohadon.pdf',
    },
    {
      titulo: 'Top de verano',
      descripcion: 'Top escotado con frunces, elástico en el busto. Tallas S a XL con guía de escalado.',
      nivel: 'Intermedio',
      categoria: 'Indumentaria',
      archivo: '/patrones/top-verano.pdf',
    },
  ];

  console.log('🧵 Sembrando patrones gratis...');
  for (const patron of patrones) {
    const existing = await prisma.pattern.findFirst({
      where: { titulo: patron.titulo },
    });
    if (existing) {
      await prisma.pattern.update({
        where: { id: existing.id },
        data: patron,
      });
      console.log(`✅ Patrón actualizado: ${patron.titulo}`);
    } else {
      await prisma.pattern.create({
        data: patron,
      });
      console.log(`✅ Patrón creado: ${patron.titulo}`);
    }
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
