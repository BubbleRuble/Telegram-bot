import { Injectable, Logger } from '@nestjs/common';
import { Telegraf, Context } from 'telegraf';
import { TelegramSessionService } from 'src/sessions/telegram-sessions.service';
import { RoleCheckService } from '../utils/role-check.service';
import { showSuperAdminMenu,showAdminMenu, showUserMenu, sendMenu } from '../utils/keyboards.service'
import { TelegramUserService } from 'src/users/telegram-user.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class BaseCommandsService {
  private readonly logger = new Logger(BaseCommandsService.name);

  constructor(
    private readonly telegramSessionService: TelegramSessionService,
    private readonly telegramUserService: TelegramUserService,
    private readonly roleCheckService: RoleCheckService,
  ) {}

  public register(bot: Telegraf<Context>) {
    this.logger.log('Registering base commands...');

    bot.start(async (ctx) => {
      await ctx.reply('Hello! I am your Telegram bot.');
      const fromId = ctx.from?.id;
      if (!fromId) return ctx.reply('Не вдалось визначити користувача.');

      const user = await this.telegramUserService.findByTelegramId(String(fromId));

      if (!user) {
      await ctx.reply('❌ Ви ще не зареєстровані в системі.');
      return;
    }
    

      const isSuperAdmin = await this.roleCheckService.isSuperAdmin(ctx);
      const isAdmin = await this.roleCheckService.isAdmin(ctx);

    switch (user.role) {
      case UserRole.SUPERADMIN:
        await showSuperAdminMenu(ctx);
        break;

      case UserRole.ADMIN:
        await showAdminMenu(ctx);
        break;

      default:
        await showUserMenu(ctx);
        break;
    }

    });

    bot.command('menu', sendMenu);
    bot.hears('Меню', sendMenu);

    bot.command('lang', async (ctx) => {
      const text =
        (ctx.message && 'text' in ctx.message ? ctx.message.text : '') || '';
      const [, codeRaw] = text.split(/\s+/, 2);
      const code = (codeRaw || '').trim();
      const fromId = ctx.from?.id;
      const chatId = ctx.chat?.id;
      if (!fromId || !chatId) {
        await ctx.reply('Could not detect user/chat.');
        return;
      }
      if (!code) {
        await ctx.reply('Usage: /lang <code>, e.g., /lang en');
        return;
      }
      await this.telegramSessionService.setLanguage(
        BigInt(fromId),
        BigInt(chatId),
        code,
      );
      await ctx.reply(`Language set to: ${code}`);
    });

    bot.hears(/ronaldo/i, async (ctx) => {
      await ctx.reply('SIUUUUUU');
    });

    bot.hears(/messi/i, async (ctx) => {
      await ctx.reply('Camera wowo');
    });

    bot.command('roll', (ctx) => {
      const num = Math.floor(Math.random() * 6) + 1;
      ctx.reply(`🎲 Твій результат: ${num}`);
    });

    bot.command('gayness', (ctx) => {
      const randomFloat = Math.random();
      const percent = Math.floor(randomFloat * 101);
      ctx.reply(`Твій результат гея: ${percent} %`);
    });
  }
}
