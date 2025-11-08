import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns';
import moment from "moment";

interface TransactionFilter {
  username?: string;
  type?: string; // "deposit" | "transfer" | "withdrawal"
  status?: 'PENDING' | 'SUCCESS' | 'FAILED';
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) { }

  async getAllTransactions(filters: TransactionFilter = {}): Promise<{
    transactions: any[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const { username, type, status, fromDate, toDate, page = 1, limit = 10 } = filters;

    let from: Date | undefined;
    let to: Date | undefined;

    // Only parse if fromDate/toDate exist
    if (fromDate) {
      const mFrom = moment(fromDate, "YYYY-MM-DD", true);
      if (mFrom.isValid()) from = mFrom.startOf("day").toDate();
    }

    if (toDate) {
      const mTo = moment(toDate, "YYYY-MM-DD", true);
      if (mTo.isValid()) to = mTo.endOf("day").toDate();
    }

    const where: any = {
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      ...(from || to
        ? {
          createdAt: {
            ...(from && { gte: from }),
            ...(to && { lte: to }),
          },
        }
        : {}),
      ...(username
        ? {
          wallet: {
            user: {
              username: {
                contains: username,
                mode: "insensitive",
              },
            },
          },
        }
        : {}),
    };

    const total = await this.prisma.transaction.count({ where });

    const transactions = await this.prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        wallet: {
          select: {
            user: { select: { id: true, username: true } },
          },
        },
      },
    });

    return {
      transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }


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

  async getTransactionStats() {
    // Get all transactions in the last week (Monday to Sunday)
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday

    const transactions = await this.prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      select: {
        amount: true,
        type: true,
        createdAt: true,
      },
    });

    const totalVolume = transactions.length;
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

    // Transactions per day
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const transactionsPerDay = days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dailyTransactions = transactions.filter(
        (t) => format(t.createdAt, 'yyyy-MM-dd') === dateStr,
      );
      return {
        date: dateStr,
        count: dailyTransactions.length,
        totalAmount: dailyTransactions.reduce((sum, t) => sum + t.amount, 0),
      };
    });

    // Distribution by type
    const distributionByType: Record<string, number> = {};
    for (const t of transactions) {
      if (!distributionByType[t.type]) distributionByType[t.type] = 0;
      distributionByType[t.type] += 1;
    }

    // Total users
    const totalUsers = await this.prisma.user.count();

    return {
      totalVolume,
      totalAmount,
      transactionsPerDay,
      distributionByType,
      totalUsers,
    };
  }
}
