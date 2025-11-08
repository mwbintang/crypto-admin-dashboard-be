import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { AuthGuard } from '../../guard/auth.guard';

@Controller('transactions')
@UseGuards(AuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get('top-user')
  async topTransactionsByUser(@Req() req, @Query('limit') limit?: number) {
    const result = await this.transactionsService.topTransactionsByUser(req.user.id, Number(limit) || 5);
    return result;
  }

  @Get('top-overall')
  async topUsersByTransactionValue(@Query('limit') limit?: number) {
    const result = await this.transactionsService.topUsersByTransactionValue(Number(limit) || 5);
    return result;
  }
}
