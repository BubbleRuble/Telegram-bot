import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SignUpDto } from 'src/dto/sign-up.dto';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';


@Injectable()
export class UsersService {
  constructor(private readonly prisma:PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({where: {email}
    })
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({where: { id }})
  }

  async createUser(dto: SignUpDto): Promise<User> {
    const { name, email, password } = dto;

    const existUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existUser) {
      throw new ConflictException('User with that email is already exist');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      }
    })
    return user;
  }

  async validateUser(email: string, plainPassword: string): Promise<User | null> {
    const user = await this.findByEmail(email);

    if(!user || !user.passwordHash) {
      return null;
    }

    const comparedPassword = await bcrypt.compare(plainPassword, user.passwordHash)
    return comparedPassword ? user : null;
  }

  async updateLastLogin(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }
  
  async logout(userId: string) {
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {lastLogoutAt: new Date()}
    })
  }
}
