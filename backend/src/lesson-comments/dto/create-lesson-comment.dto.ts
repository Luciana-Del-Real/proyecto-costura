import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateLessonCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message!: string;
}
