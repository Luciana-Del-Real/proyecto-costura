import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
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
}
