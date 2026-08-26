import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateLessonCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message!: string;

  // Id del comentario padre cuando esto es una respuesta dentro de un hilo.
  @IsOptional()
  @IsString()
  parentId?: string;

  // Ruta de la imagen adjunta (ej. "/uploads/comments/xxx.jpg"). La setea el
  // controller después del FileInterceptor cuando el request trae un archivo.
  @IsOptional()
  @IsString()
  image?: string;
}
