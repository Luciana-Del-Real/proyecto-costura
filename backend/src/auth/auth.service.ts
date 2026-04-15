import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    // Verificar si el email ya existe (Zero Trust: validar entrada)
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Este email ya está registrado');
    }

    // Hash de contraseña con bcrypt (salt rounds: 12)
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Crear usuario
    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        role: 'ALUMNO',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    // Generar JWT
    const token = this.generateToken(user);

    return {
      message: 'Registro exitoso',
      user,
      token,
    };
  }

  async login(dto: LoginDto) {
    // Buscar usuario por email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // Zero Trust: NO revelar si el email existe o no
    if (!user) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }

    // Verificar si la cuenta está activa
    if (!user.active) {
      throw new UnauthorizedException('Tu cuenta está suspendida. Contactá al administrador.');
    }

    // Generar JWT
    const token = this.generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      message: 'Inicio de sesión exitoso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  }

  async validateToken(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
      },
    });

    if (!user || !user.active) {
      return null;
    }

    return user;
  }

  private generateToken(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  // Genera token seguro, guarda hash y envía email (sin revelar existencia de cuenta)
  async forgotPassword(email: string) {
    const normalized = email.toLowerCase().trim();
    const GENERIC_RESPONSE = { message: 'Si existe una cuenta con ese email, recibirás instrucciones para restablecer la contraseña.' };

    const user = await this.prisma.user.findUnique({ where: { email: normalized } });

    if (!user) {
      // No revelar existencia de la cuenta
      return GENERIC_RESPONSE;
    }

    // Generar token aleatorio seguro
    const token = crypto.randomBytes(32).toString('hex');

    // Hash HMAC-SHA256 del token usando secreto de servidor (no almacenar token en texto)
    const resetSecret = this.config.get<string>('PASSWORD_RESET_SECRET') || this.config.get<string>('JWT_SECRET') || 'fallback-secret-key';
    const tokenHash = crypto.createHmac('sha256', resetSecret).update(token).digest('hex');

    const minutes = Number(this.config.get<number>('PASSWORD_RESET_EXPIRATION_MINUTES')) || 15;
    const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

    // Persistir registro de token (hash)
    try {
      await this.prisma.passwordResetToken.create({
        data: {
          tokenHash,
          userId: user.id,
          expiresAt,
        },
      });
    } catch (err) {
      this.logger.error('Error creando token de recuperación', err as any);
      // No propagar detalles al cliente
      return GENERIC_RESPONSE;
    }

    // Enlace de restablecimiento
    const frontend = this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const resetUrl = `${frontend}/reset-password?token=${token}`;

    const subject = 'Restablecer contraseña';
    const html = `
      <p>Hola ${user.name || ''},</p>
      <p>Recibimos una solicitud para restablecer tu contraseña. El enlace es válido por ${minutes} minutos.</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Si no solicitaste esto, puedes ignorar este correo.</p>
    `;

    try {
      await this.mailService.sendEmail(user.email, subject, html);
    } catch (err) {
      this.logger.warn('Fallo al enviar email de restablecimiento (se ignorará para no filtrar existencia)', err as any);
      // No fallar la petición por errores de envío de correo
    }

    return GENERIC_RESPONSE;
  }

  // Valida token, actualiza contraseña y marca token(s) como usados
  async resetPassword(token: string, newPassword: string) {
    const resetSecret = this.config.get<string>('PASSWORD_RESET_SECRET') || this.config.get<string>('JWT_SECRET') || 'fallback-secret-key';
    const tokenHash = crypto.createHmac('sha256', resetSecret).update(token).digest('hex');

    const tokenRecord = await this.prisma.passwordResetToken.findFirst({
      where: { tokenHash, used: false, expiresAt: { gte: new Date() } },
    });

    if (!tokenRecord) {
      throw new BadRequestException('Token inválido o expirado');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Actualizar contraseña y marcar tokens como usados en transacción atomic
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: tokenRecord.userId }, data: { password: hashedPassword } }),
      this.prisma.passwordResetToken.updateMany({ where: { userId: tokenRecord.userId, used: false }, data: { used: true } }),
    ]);

    return { message: 'Contraseña restablecida correctamente' };
  }
}
