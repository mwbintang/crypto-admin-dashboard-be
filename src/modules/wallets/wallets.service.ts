import { Injectable, NotFoundException, BadRequestException, HttpStatus, HttpException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DepositDto } from './dto/deposit.dto';
import { TransferDto } from './dto/transfer.dto';

@Injectable()
export class WalletsService {
  constructor(private prisma: PrismaService) { }

  async getBalance(userId: number): Promise<{ balance: number }> {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Wallet not found',
          error: 'NOT FOUND',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return { balance: wallet.balance };
  }

  async deposit(userId: number, depositDto: DepositDto): Promise<{ balance: number }> {
    const wallet = await this.prisma.wallet.update({
      where: { userId },
      data: { balance: { increment: depositDto.amount } },
    });

    await this.prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'deposit',
        amount: depositDto.amount,
      },
    });

    return wallet;
  }

  async transfer(userId: number, transferDto: TransferDto): Promise<{ message: string }> {
    const senderWallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!senderWallet) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Sender wallet not found',
          error: 'NOT FOUND',
        },
        HttpStatus.NOT_FOUND,
      );
    }
    if (senderWallet.balance < transferDto.amount) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Insufficient balance',
          error: 'BAD REQUEST',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const targetUser = await this.prisma.user.findUnique({ where: { username: transferDto.targetUsername } });
    if (!targetUser) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Target user not found',
          error: 'NOT FOUND',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    const receiverWallet = await this.prisma.wallet.findUnique({ where: { userId: targetUser.id } });
    if (!receiverWallet) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Destination user not found',
          error: 'NOT FOUND',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // Transaction
    await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: senderWallet.id },
        data: { balance: { decrement: transferDto.amount } },
      }),
      this.prisma.wallet.update({
        where: { id: receiverWallet.id },
        data: { balance: { increment: transferDto.amount } },
      }),
      this.prisma.transaction.create({
        data: {
          walletId: senderWallet.id,
          type: 'transfer',
          amount: transferDto.amount,
          targetUserId: targetUser.id,
        },
      }),
      this.prisma.transaction.create({
        data: {
          walletId: receiverWallet.id,
          type: 'deposit',
          amount: transferDto.amount,
        },
      }),
    ]);

    return { message: 'Transfer successful' };
  }
}
