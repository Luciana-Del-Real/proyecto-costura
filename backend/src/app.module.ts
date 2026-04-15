import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { LessonsModule } from './lessons/lessons.module';
import { PurchasesModule } from './purchases/purchases.module';
import { LessonProgressModule } from './lesson-progress/lesson-progress.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FavoritesModule } from './favorites/favorites.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'fallback-secret-key',
      signOptions: { expiresIn: process.env.JWT_EXPIRATION || '24h' },
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    LessonsModule,
    PurchasesModule,
    LessonProgressModule,
    NotificationsModule,
    FavoritesModule,
    MailModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
