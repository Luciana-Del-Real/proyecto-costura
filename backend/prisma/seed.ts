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

  // Eventos de la página pública (tarjetas-folleto con consulta por
  // WhatsApp). `title` no es @unique, así que la idempotencia se resuelve
  // con findFirst + update/create como en patrones.
  const eventos = [
    {
      title: 'Clase Personalizada',
      subtitle:
        'Si preferís aprender a tu ritmo, sin grupos, esta es tu clase. Diseñá, creá y aprendé a tu manera. Traés tu proyecto y te acompaño a hacerlo realidad.',
      detail: 'Clase de 2 horas una vez por semana',
      waMessage: 'Hola, quiero consultar sobre la Clase Personalizada',
      icon: 'UserRound',
      order: 1,
      active: true,
    },
    {
      title: 'Workshop Creativo',
      subtitle:
        'Un día para crear, disfrutar y conocer gente nueva. Aprendés una técnica específica. Una sola clase grupal de 3 horas. No se requieren conocimientos previos.',
      detail: 'Materiales + brunch + guías paso a paso.',
      waMessage: 'Hola, quiero consultar sobre el Workshop Creativo',
      icon: 'Palette',
      order: 2,
      active: true,
    },
    {
      title: 'Clase Libre',
      subtitle:
        'Vos elegís qué proyecto de bordado o costura hacer. Clases de 2 horas en grupos reducidos. No se requieren conocimientos previos.',
      detail: 'Un espacio para probar algo nuevo, sin presiones y a tu ritmo.',
      waMessage: 'Hola, quiero consultar sobre la Clase Libre',
      icon: 'Feather',
      order: 3,
      active: true,
    },
    {
      title: 'Workshop para Eventos',
      subtitle:
        'Creamos experiencias creativas para celebrar de manera diferente. Actividades personalizadas para cada ocasión. Incluye todos los materiales.',
      detail: 'Duración del encuentro 3 horas. Podés elegir entre bolsos, estuches o cuadros para bordar.',
      waMessage: 'Hola, quiero consultar sobre el Workshop para Eventos',
      icon: 'PartyPopper',
      order: 4,
      active: true,
    },
    {
      title: 'Programa Creativo',
      subtitle:
        'Pensado para quienes buscan un aprendizaje más completo y continuo. Recorrido guiado con avance real clase a clase.',
      detail: 'Pack de 4 clases de costura o bordado. Incluye materiales básicos y tutoriales impresos. Clase de 2 horas una vez por semana.',
      waMessage: 'Hola, quiero consultar sobre el Programa Creativo',
      icon: 'BookOpen',
      order: 5,
      active: true,
    },
    {
      title: 'Club de Bordado',
      subtitle:
        'Un espacio para bordar, charlar y disfrutar en grupo. Espacio creativo para bordar en grupo. Traés tu proyecto y te acompaño a hacerlo realidad.',
      detail: 'Incluye brunch + espacio + guía personalizada. Clase de 2 horas una vez por semana.',
      waMessage: 'Hola, quiero consultar sobre el Club de Bordado',
      icon: 'Users',
      order: 6,
      active: true,
    },
  ];

  console.log('🎉 Sembrando eventos...');
  for (const evento of eventos) {
    const existing = await prisma.event.findFirst({
      where: { title: evento.title },
    });
    if (existing) {
      await prisma.event.update({ where: { id: existing.id }, data: evento });
      console.log(`✅ Evento actualizado: ${evento.title}`);
    } else {
      await prisma.event.create({ data: evento });
      console.log(`✅ Evento creado: ${evento.title}`);
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
