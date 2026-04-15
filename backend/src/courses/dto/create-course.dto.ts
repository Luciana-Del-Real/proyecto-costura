import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { CourseLevel } from '../../common/enums';

export class CreateCourseDto {
  @IsString({ message: 'Título debe ser una cadena' })
  title!: string;

  @IsString({ message: 'Descripción debe ser una cadena' })
  description!: string;

  @IsOptional()
  @IsString()
  longDescription?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Precio debe ser un número' })
  @Min(0, { message: 'Precio debe ser mayor o igual a 0' })
  price?: number;

  @IsEnum(CourseLevel, { message: 'Nivel debe ser PRINCIPIANTE, INTERMEDIO o AVANZADO' })
  level!: CourseLevel;

  @IsOptional()
  @IsString()
  instructor?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  pdfGuide?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === 1 || value === '1') return true;
    if (value === 'false' || value === false || value === 0 || value === '0') return false;
    return value;
  })
  @IsBoolean()
  featured?: boolean;
}
