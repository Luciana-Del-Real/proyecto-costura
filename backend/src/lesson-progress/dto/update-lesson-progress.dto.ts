import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class UpdateLessonProgressDto {
  @IsBoolean()
  @IsNotEmpty()
  completed!: boolean;
}
