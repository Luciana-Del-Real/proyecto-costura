import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'Nombre debe ser una cadena' })
  @MinLength(2, { message: 'Nombre debe tener al menos 2 caracteres' })
  name!: string;

  @IsEmail({}, { message: 'Email debe ser válido' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Contraseña debe tener al menos 6 caracteres' })
  password!: string;
}
