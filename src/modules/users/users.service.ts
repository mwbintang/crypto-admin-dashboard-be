import { ConflictException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  // --- Register ---
  async register(data: RegisterUserDto): Promise<{ token: string }> {
    const { username, password } = data;

    // Check if user exists
    const existing = await this.prisma.user.findUnique({ where: { username } });
    if (existing) {
      throw new HttpException(
        {
          statusCode: HttpStatus.CONFLICT,
          message: 'Username already exists',
          error: 'Conflict',
        },
        HttpStatus.CONFLICT,
      );
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create user + wallet
    const user = await this.prisma.user.create({
      data: {
        username,
        password: hashed,
        wallet: {
          create: { balance: 0 },
        },
      },
      include: { wallet: true },
    });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' },
    );

    return { token };
  }

  // --- Login ---
  async login(data: LoginUserDto): Promise<{ token: string }> {
    const { username, password } = data;

    // Find user
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new Error('Invalid credentials');

    // Compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error('Invalid credentials');

    // Generate JWT (you can move secret to env)
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '1d',
    });

    return { token };
  }
}
