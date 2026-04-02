import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Seguridad: Helmet para headers HTTP
  app.use(helmet());

  // CORS restrictivo
  const corsOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'];
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

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
  await app.listen(port);
  console.log(`🚀 API ejecutándose en http://localhost:${port}`);
}

bootstrap().catch((err) => {
  console.error('❌ Error al iniciar la aplicación:', err);
  process.exit(1);
});
