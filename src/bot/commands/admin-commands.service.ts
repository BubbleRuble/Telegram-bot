import { Injectable, Logger } from '@nestjs/common';
import { Telegraf, Context } from 'telegraf';
import { TelegramUserService } from 'src/users/telegram-user.service';
import { RoleCheckService } from '../utils/role-check.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminCommandsService {
  private readonly logger = new Logger(AdminCommandsService.name);

  constructor(
    private readonly telegramUserService: TelegramUserService,
    private readonly roleCheckService: RoleCheckService,
  ) {}

  public register(bot: Telegraf<Context>) {
    this.logger.log('Registering admin/superadmin commands...');

    bot.command('promote',this.roleCheckService.superAdminOnly,async (ctx) => {
        const fromId = ctx.from?.id;
        const text =
          (ctx.message && 'text' in ctx.message ? ctx.message.text : '') || '';
        const args = text.split(' ');
        const targetId = args[1]?.trim();

        if (!targetId || isNaN(Number(targetId))) {
          return ctx.reply('❗ Використання: /promote дало збій');
        }

        if (String(fromId) === targetId)
          return ctx.reply('🤨 Не можна призначати самого себе.');

        try {
          const user =
            await this.telegramUserService.findByTelegramId(targetId);
          if (!user)
            return ctx.reply(
              '❌ Користувача не знайдено. Він повинен спершу написати /start.',
            );

          if (user.role === UserRole.SUPERADMIN) {
            return ctx.reply(
              '🔒 Цей користувач вже SUPERADMIN. Не можна понижувати його роль через /promote.',
            );
          }

          if (user.role === UserRole.ADMIN) {
            return ctx.reply(
              '✅ Користувач вже ADMIN. Немає потреби підвищувати.',
            );
          }

          await this.telegramUserService.setRole(targetId, UserRole.ADMIN);

          await ctx.replyWithMarkdownV2(
    `✅ Користувач *${user.username ?? user.telegramId}* тепер має роль \`ADMIN\``
  );
        } catch (e) {
          this.logger.error('Failed to promote user', e);
          await ctx.reply('⚠️ Помилка під час підвищення ролі.');
        }
      },
    );

    bot.command('demote', this.roleCheckService.superAdminOnly, async (ctx) => {
      const fromId = ctx.from?.id;
      const text =
        (ctx.message && 'text' in ctx.message ? ctx.message.text : '') || '';
      const args = text.split(' ');
      const targetId = args[1]?.trim();

      if (!targetId || isNaN(Number(targetId))) {
        return ctx.reply(`❗ Використання: /demote telegramId (число)`);
      }

      if (String(fromId) === targetId)
        return ctx.reply('🤨 Не можна понижувати самого себе.');

      try {
        const user = await this.telegramUserService.findByTelegramId(targetId);
        if (!user) return ctx.reply('❌ Користувача не знайдено.');

        if (user.role === UserRole.SUPERADMIN) {
          return ctx.reply('🔒 Не можна понизити роль SUPERADMIN.');
        }

        if (user.role === UserRole.USER) {
          return ctx.reply('✅ Користувач вже USER. Немає потреби понижувати.');
        }

        await this.telegramUserService.setRole(targetId, UserRole.USER);

        await ctx.replyWithMarkdownV2(
          `✅ Користувач *${user.username ?? user.telegramId}* тепер має роль \`USER\``,
        );
      } catch (e) {
        this.logger.error('Failed to demote user', e);
        await ctx.reply('⚠️ Помилка під час пониження ролі.');
      }
    });
  }
}
