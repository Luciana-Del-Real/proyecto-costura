import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePatternDto {
  @IsString({ message: 'Título debe ser una cadena' })
  @IsNotEmpty({ message: 'El título es obligatorio' })
  titulo!: string;

  @IsString({ message: 'Descripción debe ser una cadena' })
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  descripcion!: string;

  @IsOptional()
  @IsString()
  nivel: string = 'Principiante';

  @IsOptional()
  @IsString()
  categoria: string = '';

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
}