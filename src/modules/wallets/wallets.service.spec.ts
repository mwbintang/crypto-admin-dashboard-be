import { Test, TestingModule } from '@nestjs/testing';
import { WalletsService } from './wallets.service';
import { PrismaService } from '../../prisma/prisma.service';
import { HttpException } from '@nestjs/common';

describe('WalletsService', () => {
  let service: WalletsService;
  let prisma: Partial<Record<keyof PrismaService, any>>;

  beforeEach(async () => {
    prisma = {
      wallet: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      transaction: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<WalletsService>(WalletsService);
  });

  describe('getBalance', () => {
    it('should return wallet balance', async () => {
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue({ id: 1, balance: 100 });

      const result = await service.getBalance(1);

      expect(prisma.wallet.findUnique).toHaveBeenCalledWith({ where: { userId: 1 } });
      expect(result).toEqual({ balance: 100 });
    });

    it('should throw NOT_FOUND if wallet does not exist', async () => {
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getBalance(1)).rejects.toThrow(HttpException);
    });
  });

  describe('deposit', () => {
    it('should deposit amount and return updated wallet', async () => {
      const depositDto = { amount: 50 };
      const updatedWallet = { id: 1, balance: 150 };
      (prisma.wallet.update as jest.Mock).mockResolvedValue(updatedWallet);
      (prisma.transaction.create as jest.Mock).mockResolvedValue({});

      const result = await service.deposit(1, depositDto);

      expect(prisma.wallet.update).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: { balance: { increment: 50 } },
      });
      expect(prisma.transaction.create).toHaveBeenCalled();
      expect(result).toEqual(updatedWallet);
    });
  });

  describe('transfer', () => {
    const transferDto = { amount: 50, targetUsername: 'alice' };

    it('should transfer amount successfully', async () => {
      const senderWallet = { id: 1, balance: 100 };
      const targetUser = { id: 2, username: 'alice' };
      const receiverWallet = { id: 2, balance: 200 };

      (prisma.wallet.findUnique as jest.Mock)
        .mockResolvedValueOnce(senderWallet) // sender wallet
        .mockResolvedValueOnce(receiverWallet); // receiver wallet

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(targetUser);
      (prisma.$transaction as jest.Mock).mockResolvedValue({});

      const result = await service.transfer(1, transferDto);

      expect(prisma.wallet.findUnique).toHaveBeenCalledWith({ where: { userId: 1 } });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { username: 'alice' } });
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Transfer successful' });
    });

    it('should throw NOT_FOUND if sender wallet does not exist', async () => {
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.transfer(1, transferDto)).rejects.toThrow(HttpException);
    });

    it('should throw BAD_REQUEST if insufficient balance', async () => {
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1, balance: 30 }); // less than transfer amount

      await expect(service.transfer(1, transferDto)).rejects.toThrow(HttpException);
    });

    it('should throw NOT_FOUND if target user does not exist', async () => {
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1, balance: 100 });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.transfer(1, transferDto)).rejects.toThrow(HttpException);
    });

    it('should throw NOT_FOUND if receiver wallet does not exist', async () => {
      (prisma.wallet.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 1, balance: 100 }) // sender
        .mockResolvedValueOnce(null); // receiver
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 2, username: 'alice' });

      await expect(service.transfer(1, transferDto)).rejects.toThrow(HttpException);
    });
  });
});
