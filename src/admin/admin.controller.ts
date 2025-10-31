import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { UsersService } from 'src/users/users.service';
import { PaginationQueryDto } from 'src/dto/pagination.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  @Get('stats')
  async getStats() {
    const [users, tgUsers, tgActive, tgBlocked] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.telegramUser.count(),
      this.prisma.telegramUser.count({ where: { isActive: true } }),
      this.prisma.telegramUser.count({ where: { isBlocked: true } }),
    ]);
    return {
      users: { total: users },
      telegramUsers: {
        total: tgUsers,
        active: tgActive,
        blocked: tgBlocked,
      },
    };
  }

  @Get('user/:id')
  async getUserById(@Param('id') id: string) {
    return this.users.findById(id)
  }

  @Get('telegram-users')
  async listTelegramUsers(@Query() query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const skip = (page - 1) * perPage;
    const where: Prisma.TelegramUserWhereInput = {};

    if (query.isActive === 'true') {
      where.isActive = true;
    }

    if (query.isActive === 'false') {
      where.isActive = false;
    }

    const [total, items] = await Promise.all([
      this.prisma.telegramUser.count({ where }),
      this.prisma.telegramUser.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: perPage,
        select: {
          id: true,
          username: true,
          joinedAt: true,
          status: true,
          role: true,
          isActive: true,
          lastActiveAt: true,
          deactivatedAt: true,
          isBlocked: true,
          blockedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const data = items.map((u) => ({
      ...u,
      id: u.id.toString(),
      status: u.status,
    }));
    return {
      data,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }
}
