import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, HttpStatus, HttpCode } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { AuthGuard } from 'src/guard/auth.guard';
import { DepositDto } from './dto/deposit.dto';
import { TransferDto } from './dto/transfer.dto';

@Controller('wallets')
@UseGuards(AuthGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) { }

  @Get('balance')
  @HttpCode(HttpStatus.OK)
  getBalance(@Req() req): Promise<{ balance: number }> {
    // req.user.id comes from AuthGuard
    return this.walletsService.getBalance(req.user.id);
  }

  @Post('deposit')
  @HttpCode(HttpStatus.NO_CONTENT)
  deposit(@Req() req, @Body() depositDto: DepositDto): Promise<{ balance: number }> {
    return this.walletsService.deposit(req.user.id, depositDto);
  }

  @Post('transfer')
  @HttpCode(HttpStatus.NO_CONTENT)
  transfer(@Req() req, @Body() transferDto: TransferDto): Promise<{ message: string }> {
    return this.walletsService.transfer(req.user.id, transferDto);
  }
}
