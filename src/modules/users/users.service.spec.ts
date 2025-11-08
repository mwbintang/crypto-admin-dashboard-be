import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { HttpException } from '@nestjs/common';
import { ENV } from '../../constant/env';

// Mock bcrypt and jsonwebtoken globally
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: Partial<Record<keyof PrismaService, any>>;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('register', () => {
    it('should register a new user and return a token', async () => {
      const dto = { username: 'testuser', password: 'password' };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 1,
        username: dto.username,
        password: 'hashedpassword',
        wallet: { id: 1, balance: 0 },
      });

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      (jwt.sign as jest.Mock).mockReturnValue('mockedtoken');

      const result = await service.register(dto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { username: dto.username } });
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result).toEqual({ token: 'mockedtoken' });
    });

    it('should throw conflict exception if user exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1, username: 'testuser' });

      await expect(
        service.register({ username: 'testuser', password: 'password' }),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('login', () => {
    it('should return a token for valid credentials', async () => {
      const dto = { username: 'testuser', password: 'password' };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        username: 'testuser',
        password: 'hashedpassword',
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mockedtoken');

      const result = await service.login(dto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { username: dto.username } });
      expect(result).toEqual({ token: 'mockedtoken' });
    });

    it('should throw BAD_REQUEST if user does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({ username: 'nonexistent', password: 'password' }),
      ).rejects.toThrow(HttpException);
    });

    it('should throw BAD_REQUEST if password does not match', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        username: 'testuser',
        password: 'hashedpassword',
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ username: 'testuser', password: 'wrongpassword' }),
      ).rejects.toThrow(HttpException);
    });
  });
});
