import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { AuthGuard } from '../../guard/auth.guard';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let service: TransactionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: {
            topTransactionsByUser: jest.fn(),
            topUsersByTransactionValue: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<TransactionsController>(TransactionsController);
    service = module.get<TransactionsService>(TransactionsService);
  });

  describe('topTransactionsByUser', () => {
    it('should return top transactions for a user', async () => {
      const mockResult = { transactions: [{ id: 1, amount: 100 }] };
      jest
        .spyOn(service, 'topTransactionsByUser')
        .mockResolvedValue(mockResult);

      const req = { user: { id: 1 } };
      const result = await controller.topTransactionsByUser(req, 3);

      expect(service.topTransactionsByUser).toHaveBeenCalledWith(1, 3);
      expect(result).toEqual(mockResult);
    });

    it('should use default limit if none provided', async () => {
      const mockResult = { transactions: [{ id: 1, amount: 100 }] };
      jest
        .spyOn(service, 'topTransactionsByUser')
        .mockResolvedValue(mockResult);

      const req = { user: { id: 1 } };
      const result = await controller.topTransactionsByUser(req, undefined);

      expect(service.topTransactionsByUser).toHaveBeenCalledWith(1, 5); // default 5
      expect(result).toEqual(mockResult);
    });
  });

  describe('topUsersByTransactionValue', () => {
    it('should return top users by transaction value', async () => {
      const mockResult = { users: [{ userId: 1, username: 'Alice', total: 150 }] };
      jest
        .spyOn(service, 'topUsersByTransactionValue')
        .mockResolvedValue(mockResult);

      const result = await controller.topUsersByTransactionValue(2);

      expect(service.topUsersByTransactionValue).toHaveBeenCalledWith(2);
      expect(result).toEqual(mockResult);
    });

    it('should use default limit if none provided', async () => {
      const mockResult = { users: [{ userId: 1, username: 'Alice', total: 150 }] };
      jest
        .spyOn(service, 'topUsersByTransactionValue')
        .mockResolvedValue(mockResult);

      const result = await controller.topUsersByTransactionValue(undefined);

      expect(service.topUsersByTransactionValue).toHaveBeenCalledWith(5); // default 5
      expect(result).toEqual(mockResult);
    });
  });
});
