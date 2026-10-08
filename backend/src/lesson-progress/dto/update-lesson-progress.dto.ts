import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

// El endpoint de completar lección es multipart/form-data, así que `completed`
// llega como string ("true"/"false"). @Transform lo normaliza a boolean antes
// de que corra @IsBoolean.
export class UpdateLessonProgressDto {
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === 1 || value === '1') return true;
    if (value === 'false' || value === false || value === 0 || value === '0') return false;
    return value;
  })
  @IsBoolean()
  @IsNotEmpty()
  completed!: boolean;

  // Nota opcional que acompaña la evidencia de la muestra. Un string vacío
  // borra la nota existente; ausente la conserva.
  @IsOptional()
  @IsString()
  note?: string;

  // Ruta de la imagen de evidencia (ej. "/uploads/progress/xxx.jpg"). La setea
  // el controller después del FileInterceptor; el alumno no la manda como campo.
  @IsOptional()
  @IsString()
  image?: string;
}
