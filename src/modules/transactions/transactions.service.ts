import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  // Top N transactions by value for a single user
  async topTransactionsByUser(userId: number, limit: number = 5): Promise<{ transactions: any[] }> {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new Error('Wallet not found');

    const transactions = await this.prisma.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { amount: 'desc' },
      take: limit,
    });

    return { transactions };
  }

  // Overall top users by transaction value
  async topUsersByTransactionValue(limit: number = 5): Promise<{ users: any[] }> {
    const users = await this.prisma.wallet.findMany({
      select: {
        userId: true,
        user: { select: { username: true } },
        transactions: { select: { amount: true } },
      },
    });

    const usersWithTotal = users.map((u) => ({
      userId: u.userId,
      username: u.user.username,
      total: u.transactions.reduce((sum, t) => sum + t.amount, 0),
    }));

    usersWithTotal.sort((a, b) => b.total - a.total);

    return { users: usersWithTotal.slice(0, limit) };
  }
}
