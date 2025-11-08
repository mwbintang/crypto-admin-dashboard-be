import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../../prisma/prisma.service';
import moment from 'moment';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: PrismaService;

  const mockPrisma = {
    transaction: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    wallet: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    prisma = module.get<PrismaService>(PrismaService);

    // Clear mocks before each test
    jest.clearAllMocks();
  });

  describe('getAllTransactions', () => {
    it('should return paginated transactions with meta', async () => {
      const fakeTransactions = [
        { id: 1, amount: 100, type: 'deposit', createdAt: new Date(), wallet: { user: { id: 1, username: 'john' } } },
      ];

      mockPrisma.transaction.count.mockResolvedValue(1);
      mockPrisma.transaction.findMany.mockResolvedValue(fakeTransactions);

      const result = await service.getAllTransactions({ page: 1, limit: 10 });

      expect(result.transactions).toEqual(fakeTransactions);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should parse fromDate and toDate correctly using moment', async () => {
      const fromDate = new Date('2025-11-01');
      const toDate = new Date('2025-11-02');

      mockPrisma.transaction.count.mockResolvedValue(0);
      mockPrisma.transaction.findMany.mockResolvedValue([]);

      await service.getAllTransactions({ fromDate, toDate });

      const expectedFrom = moment(fromDate, 'YYYY-MM-DD', true).startOf('day').toDate();
      const expectedTo = moment(toDate, 'YYYY-MM-DD', true).endOf('day').toDate();

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: expectedFrom, lte: expectedTo },
          }),
        }),
      );
    });
  });

  describe('topTransactionsByUser', () => {
    it('should return top transactions for a user', async () => {
      const wallet = { id: 1 };
      const transactions = [{ id: 1, amount: 500 }];

      mockPrisma.wallet.findUnique.mockResolvedValue(wallet);
      mockPrisma.transaction.findMany.mockResolvedValue(transactions);

      const result = await service.topTransactionsByUser(1);

      expect(result.transactions).toEqual(transactions);
      expect(mockPrisma.wallet.findUnique).toHaveBeenCalledWith({ where: { userId: 1 } });
    });

    it('should throw error if wallet not found', async () => {
      mockPrisma.wallet.findUnique.mockResolvedValue(null);

      await expect(service.topTransactionsByUser(1)).rejects.toThrow('Wallet not found');
    });
  });

  describe('topUsersByTransactionValue', () => {
    it('should return users sorted by total transaction value', async () => {
      const wallets = [
        { userId: 1, user: { username: 'john' }, transactions: [{ amount: 100 }, { amount: 200 }] },
        { userId: 2, user: { username: 'jane' }, transactions: [{ amount: 50 }] },
      ];

      mockPrisma.wallet.findMany.mockResolvedValue(wallets);

      const result = await service.topUsersByTransactionValue();

      expect(result.users).toEqual([
        { userId: 1, username: 'john', total: 300 },
        { userId: 2, username: 'jane', total: 50 },
      ]);
    });
  });

  describe('getTransactionStats', () => {
    it('should calculate weekly stats correctly', async () => {
      const now = new Date();
      const transactions = [
        { amount: 100, type: 'deposit', createdAt: now },
        { amount: 200, type: 'transfer', createdAt: now },
      ];

      mockPrisma.transaction.findMany.mockResolvedValue(transactions);
      mockPrisma.user.count.mockResolvedValue(5);

      const result = await service.getTransactionStats();

      expect(result.totalVolume).toBe(2);
      expect(result.totalAmount).toBe(300);
      expect(result.distributionByType).toEqual({ deposit: 1, transfer: 1 });
      expect(result.totalUsers).toBe(5);
      expect(result.transactionsPerDay.length).toBe(7); // week days
    });
  });
});
