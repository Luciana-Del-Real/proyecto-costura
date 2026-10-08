import { IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean } from 'class-validator';

// El folleto se arma con texto: título, descripción y detalle son los
// campos visibles en la página pública. La imagen quedó como campo legacy
// opcional (sin uso en el flujo actual).
export class CreateEventDto {
  @IsString({ message: 'El título debe ser una cadena' })
  @IsNotEmpty({ message: 'El título es obligatorio' })
  title!: string;

  @IsString({ message: 'La descripción debe ser una cadena' })
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  subtitle!: string;

  @IsString({ message: 'El detalle debe ser una cadena' })
  @IsNotEmpty({ message: 'El detalle es obligatorio' })
  detail!: string;

  @IsOptional()
  @IsString()
  waMessage?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}