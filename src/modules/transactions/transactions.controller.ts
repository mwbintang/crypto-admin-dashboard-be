import { Controller, Get, ParseIntPipe, Query, Req, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { AuthGuard } from '../../guard/auth.guard';

@Controller('transactions')
@UseGuards(AuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get('all')
  async getAllTransactions(
    @Query('username') username?: string,
    @Query('type') type?: string,
    @Query('status') status?: 'PENDING' | 'SUCCESS' | 'FAILED',
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    const filters = {
      username,
      type,
      status,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      page,
      limit,
    };

    return this.transactionsService.getAllTransactions(filters);
  }

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

  @Get('statistic')
  async getTransactionStats() {
    const result = await this.transactionsService.getTransactionStats();
    return result;
  }
}
