import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { SignUpDto } from 'src/dto/sign-up.dto';
import type { Request, Response } from 'express';
import { SignInDto } from 'src/dto/sign-in.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private jwt: JwtService,
  ) {}

  @Post('signup')
  signUp(@Body() dto: SignUpDto, @Res({ passthrough: true }) res: Response) {
    return this.auth.signUp(dto, res);
  }

  @Post('signin')
  signIn(@Body() dto: SignInDto, @Res({ passthrough: true }) res: Response) {
    return this.auth.signIn(dto, res);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(
    @Req()
    req: Request & {
      user?: {
        sub: string;
        email: string;
        password: string;
        role: string;
        iat: string;
        exp: string;
      };
    },
  ) {
    const user = req.user;
    return user
      ? {
          sub: user.sub,
          email: user.email,
          role: user.role,
          iat: user.iat,
          exp: user.exp,
        }
      : null;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req() req: Request & { user?: { sub?: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user?.sub;
    if (userId) {
      await this.users.logout(userId);
    }
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: (process.env.NODE_ENV || 'development') === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return { success: true, message: 'Logout success' };
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  async refresh(
    @Res({ passthrough: true }) res: Response,
    @Req()
    req: Request & { cookies?: Record<string, string> } & {
      user?: { sub?: string };
    },
  ) {
    const token = req.cookies.refreshToken;
    if (!token) {
      return { accessToken: null };
    }
    const userId = req.user?.sub;
    if (userId) {
      return { accessToken: null };
    }
    const payload = await this.jwt.verifyAsync(token);

    const verifiedUserId = payload.sub as string;

    return this.auth.refreshWithCookie(verifiedUserId, token, res);
  }
}
