import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { HttpException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  describe('register', () => {
    it('should return a token on successful registration', async () => {
      const dto = { username: 'testuser', password: 'password' };
      (service.register as jest.Mock).mockResolvedValue({ token: 'mockedtoken' });

      const result = await controller.register(dto);

      expect(service.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ token: 'mockedtoken' });
    });

    it('should throw HttpException if service throws', async () => {
      const dto = { username: 'testuser', password: 'password' };
      const error = { response: { message: 'Username already exists', statusCode: 409 } };
      (service.register as jest.Mock).mockRejectedValue(error);

      await expect(controller.register(dto)).rejects.toThrow(HttpException);
    });
  });

  describe('login', () => {
    it('should return a token on successful login', async () => {
      const dto = { username: 'testuser', password: 'password' };
      (service.login as jest.Mock).mockResolvedValue({ token: 'mockedtoken' });

      const result = await controller.login(dto);

      expect(service.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ token: 'mockedtoken' });
    });

    it('should throw HttpException if service throws', async () => {
      const dto = { username: 'testuser', password: 'password' };
      const error = { message: 'Invalid credentials', response: { statusCode: 400 } };
      (service.login as jest.Mock).mockRejectedValue(error);

      await expect(controller.login(dto)).rejects.toThrow(HttpException);
    });
  });
});
