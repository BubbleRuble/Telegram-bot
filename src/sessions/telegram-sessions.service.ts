import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Context } from 'telegraf';

@Injectable()
export class TelegramSessionService {
  private readonly logger = new Logger(TelegramSessionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async upsertFromContext(ctx: Context, userIdBigInt?: bigint) {
    const fromId = userIdBigInt ?? (ctx.from ? BigInt(ctx.from.id) : undefined);
    const chatId = ctx.chat ? BigInt(ctx.chat.id) : undefined;
    if (!fromId || !chatId) {
      return null;
    }

    const language = (ctx.from as { language_code?: string } | undefined)
      ?.language_code;
    const now = new Date();

    try {
      const session = await this.prisma.telegramSession.upsert({
        where: { user_chat_unique: { userId: fromId, chatId } },
        update: {
          lastInteractionAt: now,
          ...(language ? { language } : {}),
        },
        create: {
          userId: fromId,
          chatId,
          lastInteractionAt: now,
          ...(language ? { language } : {}),
        },
      });
      return session;
    } catch (e) {
      this.logger.error('Failed to upsert Telegram session', e as Error);
      throw e;
    }
  }

  async get(userId: bigint, chatId: bigint) {
    return this.prisma.telegramSession.findUnique({
      where: {
        user_chat_unique: { userId, chatId },
      },
    });
  }

  async setLanguage(userId: bigint, chatId: bigint, language: string) {
    return this.prisma.telegramSession.update({
      where: {
        user_chat_unique: { userId, chatId },
      },
      data: { language },
    });
  }

  async updatePreferences(
    userId: bigint,
    chatId: bigint,
    patch: Record<string, any>,
  ) {
    const existUserSession = await this.get(userId, chatId);
    const currentUserSession = (existUserSession?.preferences as Record<string, any>) || {};
    const mergedSession = { ...currentUserSession, ...patch };
    return this.prisma.telegramSession.update({
      where: {
        user_chat_unique: { userId, chatId },
      },
      data: { preferences: mergedSession },
    });
  }
}
