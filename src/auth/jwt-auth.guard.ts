import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ROLES_KEY } from 'src/auth/roles.decorator';
import { AppRole } from '@prisma/client';
import { UsersService } from '../users/users.service';

type JwtPayload = {
  sub: string;
  email: string;
  role: AppRole;
  iat?: number;
  exp?: number;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private reflector: Reflector,
    private users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtPayload }>();
    const auth = request.headers['authorization'];
    if (!auth) throw new UnauthorizedException('Missing Authorization header');
    const [scheme, token] = auth.split(' ');
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException();

    try {
      const payload = this.jwt.verify(token);
      request.user = payload;
      const userId = payload?.sub;
      if (userId) {
        const user = await this.users.findById(userId);
        if (user?.isActive === false) {
          throw new UnauthorizedException('User inactive');
        }
        const iatSec = payload?.iat;
        if (user?.lastLogoutAt && iatSec) {
          const iatMs = iatSec * 1000;
          if (iatMs < new Date(user.lastLogoutAt).getTime()) {
            throw new UnauthorizedException('Token expired');
          }
        }
      }
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) return true;
    const user = request.user;
    if (!user?.role || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Role not permitted');
    }
    return true;
  }
}
