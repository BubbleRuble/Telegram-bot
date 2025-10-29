import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class SignUpDto {
  @IsString({message: 'Name must be a string'})
  @MaxLength(22, {message: 'Name must be max 22 characters'})
  @MinLength(2, {message: 'Name must be min 2 characters'})
  name: string;

  @IsEmail()
  @IsString({message: 'Email must be a string'})
  email: string;

  @IsString({message: 'Password must be a string'})
  @MinLength(8, {message: 'Password must be min 8 characters'})
  password: string;
}