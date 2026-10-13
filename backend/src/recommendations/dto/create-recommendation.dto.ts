import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

// La recomendación es una tarjeta estilo patrón: título obligatorio y
// descripción/imagen/link opcionales. El link NO valida URL a propósito
// (puede venir sin esquema y el frontend lo normaliza).
export class CreateRecommendationDto {
  @IsString({ message: 'El título debe ser una cadena' })
  @IsNotEmpty({ message: 'El título es obligatorio' })
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  link?: string;
}