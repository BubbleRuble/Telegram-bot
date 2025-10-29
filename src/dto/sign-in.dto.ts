import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignInDto {
  @IsEmail()
  @IsString({message: 'Email must be a string'})
  email: string;

  @IsString({message: 'Password must be a string'})
  @MinLength(8)
  password: string;
}