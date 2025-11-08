// src/wallet/dto/deposit.dto.ts
import { IsNumber, Min } from 'class-validator';

export class DepositDto {
  @IsNumber()
  @Min(0.01)
  amount: number;
}
