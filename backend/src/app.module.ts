import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from './config/jwt.config';
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
import { AttachmentsModule } from './attachments/attachments.module';
import { LessonCommentsModule } from './lesson-comments/lesson-comments.module';
import { CertificatesModule } from './certificates/certificates.module';
import { PatternsModule } from './patterns/patterns.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.registerAsync({
      global: true,
      useFactory: jwtConfig,
      inject: [ConfigService],
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
    AttachmentsModule,
    LessonCommentsModule,
    CertificatesModule,
    PatternsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
