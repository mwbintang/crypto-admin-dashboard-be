import { IsNumber, IsString, Min } from 'class-validator';

export class TransferDto {
  @IsString()
  targetUsername: string;

  @IsNumber()
  @Min(0.01)
  amount: number;
}