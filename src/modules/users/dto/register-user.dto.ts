import { IsNotEmpty, MinLength } from 'class-validator';

export class RegisterUserDto {
  @IsNotEmpty()
  username: string;

  @MinLength(6)
  password: string;
}
