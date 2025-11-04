import { Injectable, Logger } from '@nestjs/common';
import { Context } from 'telegraf';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, UserRole, UserStatus, TelegramUser } from '@prisma/client';

@Injectable()
export class TelegramUserService {
  private readonly logger = new Logger(TelegramUserService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findByTelegramId(telegramId: string): Promise<TelegramUser | null> {
    return this.prisma.telegramUser.findUnique({
      where: { telegramId },
    });
  }

  async upsertFromContext(ctx: Context) {
    const from = ctx.from;
    if (!from) return null;

    const id = BigInt(from.id);
    const telegramId = String(from.id);
    const username = from.username ?? null;

    const tsSeconds = ctx.message?.date ?? ctx.callbackQuery?.message?.date;

    const joinedAt = tsSeconds ? new Date(tsSeconds * 1000) : new Date();
    const now = new Date();

    try {
      const user = await this.prisma.telegramUser.upsert({
        where: { id },
        update: {
          username,
          telegramId,
          status: UserStatus.ACTIVE,
          isActive: true,
          lastActiveAt: now,
        },
        create: {
          id,
          telegramId,
          username,
          joinedAt,
          status: UserStatus.ACTIVE,
          role: telegramId === process.env.SUPERADMIN_ID ? UserRole.SUPERADMIN : UserRole.USER,
          isActive: true,
          lastActiveAt: now,
        },
      });

       if (telegramId === process.env.SUPERADMIN_ID) {
      user.role = UserRole.SUPERADMIN;
    }
      return user;
    } catch (e) {
      this.logger.error('Failed to upsert Telegram user', e as Error);
      throw e;
    }
  }

  async setRole(
    telegramId: string,
    newRole: UserRole,
  ): Promise<TelegramUser | null> {
    try {
      return this.prisma.telegramUser.update({
        where: { telegramId },
        data: { role: newRole },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(`User with ID ${telegramId} not found.`);
        return null;
      }
      throw error;
    }
  }

  async blockUser(id: bigint, reason?: string) {
    const now = new Date();
    return this.prisma.telegramUser.update({
      where: { id },
      data: {
        isBlocked: true,
        blockedAt: now,
        blockedReason: reason ?? null,
        status: UserStatus.BANNED,
      },
    });
  }

  async unblockUser(id: bigint) {
    const now = new Date();
    return this.prisma.telegramUser.update({
      where: { id },
      data: {
        isBlocked: false,
        unblockedAt: now,
        blockedReason: null,
        status: UserStatus.ACTIVE,
      },
    });
  }
}
