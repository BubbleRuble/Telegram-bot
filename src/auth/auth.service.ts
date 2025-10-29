import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { SignUpDto } from 'src/dto/sign-up.dto';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { SignInDto } from 'src/dto/sign-in.dto';
import { User } from '@prisma/client';
import { RefreshTokensService } from './refresh-tokens.service';

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
    private rts: RefreshTokensService,
  ) {}

  async signUp(dto: SignUpDto, res: Response) {
    const existUser = await this.users.findByEmail(dto.email);
    if (existUser) {
      throw new UnauthorizedException('User with that email is already exist');
    }

    const user = await this.users.createUser({
      name: dto.name,
      email: dto.email,
      password: dto.password,
    });
    const access_token = await this.issueAccessToken(user);
    if (res) await this.setRefreshCookie(res, user);
    return { user, access_token };
  }

  async signIn(
    dto: SignInDto,
    res?: Response,
  ): Promise<{ user: User; access_token: string }> {
    const user = await this.users.validateUser(dto.email, dto.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    await this.users.updateLastLogin(user.id);
    const access_token = await this.issueAccessToken(user);
    if (res) {
      await this.setRefreshCookie(res, user)
    };
    return { user, access_token };
  }

  private async issueAccessToken(user: User): Promise<string> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwt.signAsync(payload);
  }

  async refresh(user: User, res?: Response): Promise<{ access_token: string }> {
    const access_token = await this.issueAccessToken(user);
    if (res) await this.setRefreshCookie(res, user);
    return { access_token };
  }

  async refreshWithCookie(userId: string, tokenPlain: string, res: Response) {
    const refreshToken = await this.rts.verifyAndConsume(userId, tokenPlain);
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    return this.refresh(user, res);
  }

  private async setRefreshCookie(res: Response, user: User) {
    const token = this.rts.generateTokenString();
    await this.rts.create(user.id, token);
    const secure = (process.env.NODE_ENV || 'development') === 'production';
    res.cookie('rt', token, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, 
    });
  }
}
