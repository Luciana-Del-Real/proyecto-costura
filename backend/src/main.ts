import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { join } from 'path';
import { AppModule } from './app.module';
import { exec } from 'child_process';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Servir archivos estáticos (imágenes y PDFs subidos)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Seguridad: Helmet para headers HTTP
  app.use(
    helmet({
      crossOriginResourcePolicy: false, // Permite cargar recursos estáticos (imágenes/pdfs) desde otros dominios (ej. el frontend)
    }),
  );

  // CORS permisivo para desarrollo (usar la API de Nest para asegurar cabeceras en errores y preflight)
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];

  // Log útil para debugging local
  console.log('CORS origins:', corsOrigins);

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // máximo 100 requests por ventana
      message: 'Demasiadas solicitudes, intenta más tarde',
    })
  );

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  // Prefijo de API
  app.setGlobalPrefix(process.env.API_PREFIX || '/api');

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API ejecutándose en http://localhost:${port}`);
  await seedAdmin();
}

bootstrap().catch((err) => {
  console.error('❌ Error al iniciar la aplicación:', err);
  process.exit(1);
});

async function seedAdmin() {
  const prisma = new PrismaClient();
  try {
    const email = process.env.ADMIN_EMAIL || 'daiana@grow.com';
    const password = process.env.ADMIN_PASSWORD || 'Daiana2026!';
    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'ADMIN', // Asegúrate de que tu modelo User tenga este campo role
          name: process.env.ADMIN_NAME || 'Administrador', // Descomenta si tu modelo usa 'name'
        },
      });
      console.log('👑 Administrador creado automáticamente en la BD.');
    }
  } catch (e) {
    console.error('Error al crear el admin:', e);
  } finally {
    await prisma.$disconnect();
  }
}
