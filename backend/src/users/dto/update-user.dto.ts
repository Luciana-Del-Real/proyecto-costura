import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * PATCH /users/:id — every field is optional so the profile edit can
 * update name, email, country individually or all at once. Country values
 * mirror the register DTO (ARS/AUD currency codes).
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'Nombre debe ser una cadena' })
  @MinLength(2, { message: 'Nombre debe tener al menos 2 caracteres' })
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email debe ser válido' })
  email?: string;

  @IsOptional()
  @IsIn(['ARS', 'AUD'], { message: 'País debe ser ARS (Argentina) o AUD (Australia)' })
  country?: string;
}