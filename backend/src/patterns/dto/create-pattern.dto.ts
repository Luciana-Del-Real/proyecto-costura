import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

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
  @IsString()
  imagen?: string;

  @IsOptional()
  @IsString()
  archivo?: string;
}