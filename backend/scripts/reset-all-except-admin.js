/**
 * Borra TODO el contenido de la base (cursos, lecciones, adjuntos, ventas,
 * progreso, favoritos, notificaciones) EXCEPTO los usuarios con role ADMIN.
 *
 * Uso:
 *   node scripts/reset-all-except-admin.js            -> pide confirmación
 *   node scripts/reset-all-except-admin.js --yes       -> lo hace sin preguntar
 *
 * IMPORTANTE: esta acción es irreversible. Hacé un backup de la base antes
 * si te importa conservar algo de lo que vas a borrar.
 */
const { PrismaClient } = require('@prisma/client');
const readline = require('readline');
require('dotenv').config();

const prisma = new PrismaClient();

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
}

async function main() {
  const skipConfirm = process.argv.includes('--yes');

  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true, email: true } });
  if (admins.length === 0) {
    throw new Error('No se encontró ningún usuario con role ADMIN. Cancelado por seguridad.');
  }

  console.log('Se conservarán estos usuarios admin:');
  admins.forEach(a => console.log(`  - ${a.email}`));
  console.log('\nSe van a borrar: todas las compras, cursos, lecciones, adjuntos (PDFs/imágenes),');
  console.log('progreso de lecciones, favoritos, notificaciones, tokens de recuperación de contraseña');
  console.log('y todos los usuarios que NO sean admin.\n');

  if (!skipConfirm) {
    const answer = await ask('¿Confirmás que querés borrar todo esto? Escribí "SI" para continuar: ');
    if (answer.trim().toUpperCase() !== 'SI') {
      console.log('Cancelado. No se borró nada.');
      return;
    }
  }

  // Orden importante: Purchase no tiene cascade (a propósito, por seguridad
  // contable), así que hay que borrarla ANTES que Course y User.
  const result = await prisma.$transaction(async (tx) => {
    const purchases = await tx.purchase.deleteMany({});
    const lessonProgress = await tx.lessonProgress.deleteMany({});
    const favorites = await tx.favorite.deleteMany({});
    const notifications = await tx.notification.deleteMany({});
    const passwordResetTokens = await tx.passwordResetToken.deleteMany({});
    const attachments = await tx.attachment.deleteMany({});
    const lessons = await tx.lesson.deleteMany({});
    const courses = await tx.course.deleteMany({});
    const users = await tx.user.deleteMany({ where: { role: { not: 'ADMIN' } } });

    return { purchases, lessonProgress, favorites, notifications, passwordResetTokens, attachments, lessons, courses, users };
  });

  console.log('\n✅ Limpieza completada:');
  console.log(`- Compras eliminadas: ${result.purchases.count}`);
  console.log(`- Progreso de lecciones eliminado: ${result.lessonProgress.count}`);
  console.log(`- Favoritos eliminados: ${result.favorites.count}`);
  console.log(`- Notificaciones eliminadas: ${result.notifications.count}`);
  console.log(`- Tokens de recuperación eliminados: ${result.passwordResetTokens.count}`);
  console.log(`- Adjuntos (PDFs) eliminados: ${result.attachments.count}`);
  console.log(`- Lecciones eliminadas: ${result.lessons.count}`);
  console.log(`- Cursos eliminados: ${result.courses.count}`);
  console.log(`- Usuarios no-admin eliminados: ${result.users.count}`);

  const remainingUsers = await prisma.user.findMany({ select: { email: true, role: true } });
  console.log('\nUsuarios que quedaron en la base:', remainingUsers);

  console.log('\nNota: los archivos físicos (imágenes y PDFs) que ya estaban subidos en');
  console.log('backend/uploads/courses y backend/uploads/lessons NO se borraron automáticamente,');
  console.log('porque están fuera de la base de datos. Si querés liberar ese espacio también,');
  console.log('podés borrar el contenido de esas dos carpetas a mano.');
}

main()
  .catch((error) => {
    console.error('❌ Error en la limpieza:', error.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });