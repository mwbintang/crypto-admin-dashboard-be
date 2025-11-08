import { Test, TestingModule } from '@nestjs/testing';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';
import { AuthGuard } from '../../guard/auth.guard';

describe('WalletsController', () => {
  let controller: WalletsController;
  let service: WalletsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletsController],
      providers: [
        {
          provide: WalletsService,
          useValue: {
            getBalance: jest.fn(),
            deposit: jest.fn(),
            transfer: jest.fn(),
          },
        },
      ],
    })
    .overrideGuard(AuthGuard)
    .useValue({ canActivate: jest.fn(() => true) })
    .compile();

    controller = module.get<WalletsController>(WalletsController);
    service = module.get<WalletsService>(WalletsService);
  });

  describe('getBalance', () => {
    it('should return the wallet balance', async () => {
      const mockBalance = { balance: 100 };
      (service.getBalance as jest.Mock).mockResolvedValue(mockBalance);

      const req = { user: { id: 1 } };
      const result = await controller.getBalance(req);

      expect(service.getBalance).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockBalance);
    });
  });

  describe('deposit', () => {
    it('should deposit amount and return updated balance', async () => {
      const depositDto = { amount: 50 };
      const mockBalance = { balance: 150 };
      (service.deposit as jest.Mock).mockResolvedValue(mockBalance);

      const req = { user: { id: 1 } };
      const result = await controller.deposit(req, depositDto);

      expect(service.deposit).toHaveBeenCalledWith(1, depositDto);
      expect(result).toEqual(mockBalance);
    });
  });

  describe('transfer', () => {
    it('should transfer amount and return success message', async () => {
      const transferDto = { recipientId: 2, amount: 50, targetUsername: 'alice' };
      const mockResult = { message: 'Transfer successful' };
      (service.transfer as jest.Mock).mockResolvedValue(mockResult);

      const req = { user: { id: 1 } };
      const result = await controller.transfer(req, transferDto);

      expect(service.transfer).toHaveBeenCalledWith(1, transferDto);
      expect(result).toEqual(mockResult);
    });
  });
});
