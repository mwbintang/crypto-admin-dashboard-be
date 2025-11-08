import { Body, Controller, Post, HttpException, HttpStatus, HttpCode } from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // --- Register ---
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterUserDto): Promise<{ token: string }> {
    try {
      return await this.usersService.register(body);
    } catch (error) {
      throw new HttpException(error.response.message, error.response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // --- Login ---
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginUserDto): Promise<{ token: string }> {
    try {
      return await this.usersService.login(body);
    } catch (error) {
      throw new HttpException(error.message, error.response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
