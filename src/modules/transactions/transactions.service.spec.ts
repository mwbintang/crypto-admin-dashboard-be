import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: Partial<Record<keyof PrismaService, any>>;

  beforeEach(async () => {
    // Mock PrismaService
    prisma = {
      wallet: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      transaction: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  describe('topTransactionsByUser', () => {
    it('should return top transactions for a user', async () => {
      const userId = 1;
      const wallet = { id: 10, userId };
      const transactions = [
        { id: 1, amount: 100 },
        { id: 2, amount: 50 },
      ];

      prisma.wallet.findUnique.mockResolvedValue(wallet);
      prisma.transaction.findMany.mockResolvedValue(transactions);

      const result = await service.topTransactionsByUser(userId, 2);

      expect(prisma.wallet.findUnique).toHaveBeenCalledWith({ where: { userId } });
      expect(prisma.transaction.findMany).toHaveBeenCalledWith({
        where: { walletId: wallet.id },
        orderBy: { amount: 'desc' },
        take: 2,
      });
      expect(result).toEqual({ transactions });
    });

    it('should throw an error if wallet not found', async () => {
      prisma.wallet.findUnique.mockResolvedValue(null);

      await expect(service.topTransactionsByUser(1)).rejects.toThrow('Wallet not found');
    });
  });

  describe('topUsersByTransactionValue', () => {
    it('should return top users by total transaction value', async () => {
      const users = [
        {
          userId: 1,
          user: { username: 'Alice' },
          transactions: [{ amount: 100 }, { amount: 50 }],
        },
        {
          userId: 2,
          user: { username: 'Bob' },
          transactions: [{ amount: 200 }],
        },
      ];

      prisma.wallet.findMany.mockResolvedValue(users);

      const result = await service.topUsersByTransactionValue(2);

      expect(prisma.wallet.findMany).toHaveBeenCalledWith({
        select: {
          userId: true,
          user: { select: { username: true } },
          transactions: { select: { amount: true } },
        },
      });

      expect(result).toEqual({
        users: [
          { userId: 2, username: 'Bob', total: 200 },
          { userId: 1, username: 'Alice', total: 150 },
        ],
      });
    });

    it('should respect the limit', async () => {
      const users = [
        { userId: 1, user: { username: 'Alice' }, transactions: [{ amount: 100 }] },
        { userId: 2, user: { username: 'Bob' }, transactions: [{ amount: 200 }] },
        { userId: 3, user: { username: 'Charlie' }, transactions: [{ amount: 50 }] },
      ];

      prisma.wallet.findMany.mockResolvedValue(users);

      const result = await service.topUsersByTransactionValue(2);

      expect(result.users.length).toBe(2);
      expect(result.users[0].username).toBe('Bob');
      expect(result.users[1].username).toBe('Alice');
    });
  });
});
