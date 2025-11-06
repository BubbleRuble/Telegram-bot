import { Injectable, Logger } from '@nestjs/common';
import { Telegraf, Context } from 'telegraf';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { RoleCheckService } from '../utils/role-check.service';

@Injectable()
export class AdminActionsService {
  private readonly logger = new Logger(AdminActionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly roleCheckService: RoleCheckService,
  ) {}

  public register(bot: Telegraf<Context>) {
    this.logger.log('Registering admin/superadmin actions...');

    //STATS

    bot.action('ADMIN_STATS', this.roleCheckService.adminOnly, async (ctx) => {
      try {
        await ctx.answerCbQuery('📊 Collecting stats...');
        const chatId = ctx.chat?.id;

        const sessions = await this.prisma.telegramSession.findMany({
          where: { chatId },
          include: { user: true },
        });

        const totalUsers = sessions.length;
        const admins = sessions.filter(
          (s) => s.user.role === UserRole.ADMIN,
        ).length;
        const blockedUsers = sessions.filter((s) => s.user.isBlocked).length;
        const activeUsers = sessions.filter((s) => s.user.isActive).length;

        const lastActiveUser = await this.prisma.telegramUser.findFirst({
          orderBy: { lastActiveAt: 'desc' },
          select: { username: true, lastActiveAt: true },
        });

        const formattedDate = new Date(
          lastActiveUser?.lastActiveAt ?? Date.now(),
        ).toLocaleString('en-US', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        const statsMessage = `📊 *Bot Statistics*
👥 Total users: *${totalUsers}*
👑 Admins: *${admins}*
🟢 Active users: *${activeUsers}*
🚫 Blocked users: *${blockedUsers}*
🕒 Last activity: *${formattedDate}*`;

        await ctx.replyWithMarkdownV2(statsMessage);
      } catch (err) {
        this.logger.error('Failed to fetch stats', err as Error);
        await ctx.reply('Не вдалося отримати статистику.');
      }
    });

    bot.action(
      'SUPERADMIN_MANAGE',
      this.roleCheckService.superAdminOnly,
      async (ctx) => {
        const messageChatId = ctx.update.callback_query?.message?.chat.id;
        const fromChatId = ctx.chat?.id;

        if (messageChatId !== fromChatId) {
          await ctx.answerCbQuery('Ця кнопка не для вас 🫠', {
            show_alert: true,
          });
          return;
        }

        try {
          await ctx.answerCbQuery('🛠 Fetching user list...');

          const users = await this.prisma.telegramUser.findMany({
            select: { telegramId: true, username: true, role: true },
            orderBy: { role: 'desc' },
          });

          const lines = users
            .map(
              (u) =>
                `\`${u.telegramId}\` 👤 ${u.username ?? 'no name'} — *${
                  u.role
                }*`,
            )
            .join('\n');

          await ctx.replyWithMarkdownV2(
            `🛠️ *User List by ID:*\n\n${lines}\n\n` +
              `\nВикористайте команди:\n\`/promote <telegramId>\`\n\`/demote <telegramId>\``,
          );
        } catch (err) {
          this.logger.error('Failed to fetch users list', err as Error);
          await ctx.reply('Не вдалося отримати список користувачів.');
        }
      },
    );
  }
}
