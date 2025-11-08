import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let service: TransactionsService;

  const mockService = {
    getAllTransactions: jest.fn(),
    topTransactionsByUser: jest.fn(),
    topUsersByTransactionValue: jest.fn(),
    getTransactionStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        { provide: TransactionsService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    service = module.get<TransactionsService>(TransactionsService);

    jest.clearAllMocks();
  });

  describe('getAllTransactions', () => {
    it('should call service with correct filters', async () => {
      const mockResult = { transactions: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
      mockService.getAllTransactions.mockResolvedValue(mockResult);

      const query = {
        username: 'john',
        type: 'deposit',
        status: 'SUCCESS',
        fromDate: '2025-11-01',
        toDate: '2025-11-02',
        page: '1',
        limit: '5',
      };

      const result = await controller.getAllTransactions(
        query.username,
        query.type,
        query.status as 'SUCCESS',
        query.fromDate,
        query.toDate,
        Number(query.page),
        Number(query.limit),
      );

      expect(mockService.getAllTransactions).toHaveBeenCalledWith({
        username: 'john',
        type: 'deposit',
        status: 'SUCCESS',
        fromDate: new Date('2025-11-01'),
        toDate: new Date('2025-11-02'),
        page: 1,
        limit: 5,
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('topTransactionsByUser', () => {
    it('should call service with user id and limit', async () => {
      const mockResult = { transactions: [] };
      mockService.topTransactionsByUser.mockResolvedValue(mockResult);

      const req = { user: { id: 1 } };
      const limit = 3;

      const result = await controller.topTransactionsByUser(req, limit);

      expect(mockService.topTransactionsByUser).toHaveBeenCalledWith(1, limit);
      expect(result).toEqual(mockResult);
    });

    it('should default limit to 5 if not provided', async () => {
      const mockResult = { transactions: [] };
      mockService.topTransactionsByUser.mockResolvedValue(mockResult);

      const req = { user: { id: 1 } };

      const result = await controller.topTransactionsByUser(req);

      expect(mockService.topTransactionsByUser).toHaveBeenCalledWith(1, 5);
      expect(result).toEqual(mockResult);
    });
  });

  describe('topUsersByTransactionValue', () => {
    it('should call service with limit', async () => {
      const mockResult = { users: [] };
      mockService.topUsersByTransactionValue.mockResolvedValue(mockResult);

      const limit = 4;
      const result = await controller.topUsersByTransactionValue(limit);

      expect(mockService.topUsersByTransactionValue).toHaveBeenCalledWith(limit);
      expect(result).toEqual(mockResult);
    });

    it('should default limit to 5 if not provided', async () => {
      const mockResult = { users: [] };
      mockService.topUsersByTransactionValue.mockResolvedValue(mockResult);

      const result = await controller.topUsersByTransactionValue(undefined);

      expect(mockService.topUsersByTransactionValue).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getTransactionStats', () => {
    it('should call service and return stats', async () => {
      const mockResult = { totalVolume: 10 };
      mockService.getTransactionStats.mockResolvedValue(mockResult);

      const result = await controller.getTransactionStats();

      expect(mockService.getTransactionStats).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });
});
