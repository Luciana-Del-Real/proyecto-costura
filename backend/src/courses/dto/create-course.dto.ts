import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, Min } from 'class-validator';

enum Level {
  PRINCIPIANTE = 'PRINCIPIANTE',
  INTERMEDIO = 'INTERMEDIO',
  AVANZADO = 'AVANZADO',
}

export class CreateCourseDto {
  @IsString({ message: 'Título debe ser una cadena' })
  title!: string;

  @IsString({ message: 'Descripción debe ser una cadena' })
  description!: string;

  @IsOptional()
  @IsString()
  longDescription?: string;

  @IsNumber()
  @Min(0, { message: 'Precio debe ser mayor a 0' })
  price!: number;

  @IsEnum(Level, { message: 'Nivel debe ser PRINCIPIANTE, INTERMEDIO o AVANZADO' })
  level!: Level;

  @IsOptional()
  @IsString()
  instructor?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;
}
