import { IsString, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class UpdatePatternDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  nivel?: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Precio ARS debe ser un número' })
  @Min(0, { message: 'Precio ARS debe ser mayor o igual a 0' })
  precioARS?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Precio AUD debe ser un número' })
  @Min(0, { message: 'Precio AUD debe ser mayor o igual a 0' })
  precioAUD?: number;

  @IsOptional()
  @IsString()
  imagen?: string;

  @IsOptional()
  @IsString()
  archivo?: string;

  // El update del admin también llega como multipart, así que `active` puede
  // venir como string ("true"/"false"). @Transform lo normaliza a boolean
  // antes de que corra @IsBoolean (igual que UpdateLessonProgressDto).
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === 1 || value === '1') return true;
    if (value === 'false' || value === false || value === 0 || value === '0') return false;
    return value;
  })
  @IsBoolean()
  active?: boolean;
}