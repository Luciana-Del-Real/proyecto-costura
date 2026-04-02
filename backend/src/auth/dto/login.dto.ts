import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email debe ser válido' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Contraseña debe tener al menos 6 caracteres' })
  password!: string;
}
