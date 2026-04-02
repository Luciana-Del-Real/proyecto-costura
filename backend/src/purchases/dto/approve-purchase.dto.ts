import { IsString, IsNotEmpty } from 'class-validator';

export class ApprovePurchaseDto {
  @IsString()
  @IsNotEmpty()
  purchaseId!: string;
}
