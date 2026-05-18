import { IsString, IsNumber, IsNotEmpty, Min, IsOptional } from 'class-validator';

export class CreateLessonDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  duration!: string;

  @IsString()
  @IsNotEmpty()
  videoUrl!: string;

  @IsOptional()
  @IsString()
  pdf?: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  order!: number;

  @IsString()
  @IsNotEmpty()
  courseId!: string;
}
