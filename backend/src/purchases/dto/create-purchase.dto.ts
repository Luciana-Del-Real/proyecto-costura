import { IsString, IsNotEmpty } from 'class-validator';

export class CreatePurchaseDto {
  @IsString()
  @IsNotEmpty()
  courseId!: string;
}
