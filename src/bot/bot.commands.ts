import { Telegraf, Context, Markup } from 'telegraf';
import { UserRole } from '@prisma/client';
import { Injectable, Logger } from '@nestjs/common';
import { TelegramUserService } from 'src/users/telegram-user.service';
import { TelegramSessionService } from 'src/sessions/telegram-sessions.service';
import { PrismaService } from 'src/prisma/prisma.service';


export const BOT_COMMANDS = [
  { command: 'start', description: 'Start the bot' },
  { command: 'ronaldo', description: 'Check bot football knowlenge' },
  { command: 'messi', description: 'Check bot knowlenge' },
  { command: 'roll', description: 'Roll the cube' },
  { command: 'lang', description: 'Set language, e.g. /lang en' },
  { command: 'gayness', description: 'Check your gayness percentage' },
  { command: 'menu', description: 'Show interactive  menu' },
];

@Injectable()
export class BotCommandsService {
  private readonly logger = new Logger(BotCommandsService.name);

  constructor(
    private readonly telegramUserService: TelegramUserService,
    private readonly telegramSessionService: TelegramSessionService,
    private readonly prisma: PrismaService
  ) {}

  public register(bot: Telegraf<Context>) {
    this.logger.log('⚙️ Registering bot commands...');

  // bot.start(async (ctx) => {
  //   await ctx.reply(
  //     `Hello, ${ctx.from.username}!`,
  //     Markup.keyboard(['Меню']).resize().oneTime(false),
  //   );
  // });

  const isSuperAdminFn = async (ctx: Context): Promise<boolean> => {
  const fromId = ctx.from?.id;
  if (!fromId) return false;

  try {
    const user = await this.telegramUserService.findByTelegramId(String(fromId));
    return user?.role === UserRole.SUPERADMIN;
  } catch (err) {
    this.logger.error(`isSuperAdmin check failed: ${err}`);
    return false;
  }
}

  const isAdminFn = async (ctx: Context): Promise<boolean> => {
      const fromId = ctx.from?.id;
      if (!fromId) return false;
    
      try {
        const user = await this.telegramUserService.findByTelegramId(String(fromId));
        return user?.role === UserRole.ADMIN; 
      } catch (err) {
        this.logger.error(`isAdmin check failed: ${err}`);
        return false;
      }
    }

  const showAdminMenu = (ctx: Context, isSuperAdminFn: boolean) => {
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('View Stats', 'ADMIN_STATS')],
    ]);

    if (isSuperAdminFn) {
    Markup.inlineKeyboard([
      [Markup.button.callback('View Stats', 'ADMIN_STATS')],
      [Markup.button.callback('Manage Admins', 'SUPERADMIN_MANAGE')],
    ])
  }
    return ctx.reply('Admin Menu:', keyboard);
  };

  const showUserMenu = (ctx: Context) => {
    const keyboard = Markup.keyboard(['Меню']).resize().oneTime(false)
    return ctx.reply('User Menu:', keyboard);
  };

  bot.start(async (ctx) => {
    await ctx.reply('Hello! I am your Telegram bot.');

    const isAdmin = await isAdminFn(ctx);
    const isSuperAdmin = await isSuperAdminFn(ctx);
    if (isAdmin || isSuperAdmin) {
      await showAdminMenu(ctx, true);
    } else {
      await showUserMenu(ctx);
    }
  });

  async function sendMenu(ctx) {
    await ctx.reply(
      'Оберіть одну з опцій:',
      Markup.inlineKeyboard([
        [
          Markup.button.callback('Допомога', 'help_action'),
          Markup.button.callback('About', 'about_action'),
        ],
        [Markup.button.callback('Закрити меню', 'close_action')],
      ]),
    );
  }

  bot.command('menu', sendMenu);

  bot.hears('Меню', sendMenu);

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
    const percent = Math.floor(randomFloat * 101) + 1;
    ctx.reply(`Твій результат гея: ${percent} %`);
  });

  bot.command('lang', async (ctx) => {
    const text =
      (ctx.message && 'text' in ctx.message ? ctx.message.text : '') || '';
    const [codeRaw] = text.split(/\s+/, 2);
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



  bot.command('promote', async (ctx) => {
  const fromId = ctx.from?.id;
  if (!fromId) return ctx.reply('❌ Немає доступу');

  const caller = await this.telegramUserService.findByTelegramId(String(fromId));
  if (caller?.role !== UserRole.SUPERADMIN) {
    return ctx.reply('🚫 Лише SUPERADMIN може призначати адміністраторів!');
  }

  const args = ctx.message.text.split(' ');
  const targetId = args[1];
  if (!targetId) return ctx.reply('❗ Використання: /promote <telegramId>');

  if (String(fromId) === targetId)
    return ctx.reply('🤨 Не можна призначати самого себе.');

  const user = await this.telegramUserService.findByTelegramId(targetId);
  if (!user) return ctx.reply('❌ Користувача не знайдено.');

  await this.prisma.telegramUser.update({ where: { telegramId: targetId }, data: { role: UserRole.ADMIN }, });

  await ctx.replyWithMarkdownV2(
    `✅ Користувач *${user.username ?? user.telegramId}* тепер має роль \`ADMIN\``
  );
});

 bot.command('demote', async (ctx) => {
  const fromId = ctx.from?.id;
  if (!fromId) return ctx.reply('❌ Немає доступу');

  const caller = await this.telegramUserService.findByTelegramId(String(fromId));
  if (caller?.role !== UserRole.SUPERADMIN) {
    return ctx.reply('🚫 Лише SUPERADMIN може призначати адміністраторів!');
  }

  const args = ctx.message.text.split(' ');
  const targetId = args[1];
  if (!targetId) return ctx.reply('❗ Використання: /promote <telegramId>');

  if (String(fromId) === targetId)
    return ctx.reply('🤨 Не можна призначати самого себе.');

  const user = await this.telegramUserService.findByTelegramId(targetId);
  if (!user) return ctx.reply('❌ Користувача не знайдено.');

  await this.prisma.telegramUser.update({ where: { telegramId: targetId }, data: { role: UserRole.ADMIN }, });

  await ctx.replyWithMarkdownV2(
    `✅ Користувач *${user.username ?? user.telegramId}* тепер має роль \`ADMIN\``
  );
});

  //ACTIONS

  bot.action('SUPERADMIN_MANAGE', async (ctx) => {
  try {
    const users = await this.prisma.telegramUser.findMany({
      select: { id: true, username: true, role: true },
    });

    const lines = users
      .map((u) => `👤 ${u.username ?? '(без імені)'} — ${u.role}`)
      .join('\n');

    await ctx.replyWithMarkdown(
      `🛠 *User list:*\n${lines}\n\nВикористай команду:\n/promote <telegramId>\n/demote <telegramId>`
    );
  } catch (err) {
    this.logger.error('Failed to fetch users list', err as Error);
    await ctx.reply('Не вдалося отримати список користувачів.');
  }
});

  bot.action('ADMIN_STATS', async (ctx) => {
    try {
      await ctx.answerCbQuery('📊 Collecting stats...');

      const totalUsers = await this.prisma.telegramUser.count()
      const activeUsers = await this.prisma.telegramUser.count({ where: { isActive: true } });
      const blockedUsers = await this.prisma.telegramUser.count({ where: { isBlocked: true } });
      const lastActiveUser = await this.prisma.telegramUser.findFirst({
      orderBy: { lastActiveAt: 'desc' },
      select: { username: true, lastActiveAt: true },
    });

     const statsMessage = `
📊 *Bot Statistics*
👥 Total users: *${totalUsers}*
🟢 Active users: *${activeUsers}*
🚫 Blocked users: *${blockedUsers}*
🕒 Last activity: *${lastActiveUser?.lastActiveAt.toLocaleString('uk-UA')}* 
👤 Last active user: *${lastActiveUser?.username ?? 'Unknown'}*
    `;

    await ctx.replyWithMarkdown(statsMessage);
    } catch (err) {
      this.logger.error('Failed to fetch stats', err as Error);
    await ctx.reply('Не вдалося отримати статистику.');
    }
  })

  bot.action('help_action', async (ctx) => {
    await ctx.answerCbQuery('Показую команди...');

    const lines = BOT_COMMANDS.map(
      (c) => `/${c.command} - ${c.description}`,
    ).join('\n');

    const helpMessage = `Доступні команди:\n${lines}`;

    await ctx.editMessageText(
      helpMessage,
      Markup.inlineKeyboard([
        [Markup.button.callback('Повернутися до меню', 'back_to_menu')],
      ]),
    );
  });

  bot.action('about_action', async (ctx) => {
    await ctx.reply(
      `Here you can see info about bot, Dmytro Shototam @shotofunny`,
    );
  });

  bot.action('close_action', async (ctx) => {
    await ctx.answerCbQuery('Меню закрито.');

    await ctx.deleteMessage();
  });

  bot.action('back_to_menu', async (ctx) => {
    await ctx.answerCbQuery('Повертаємось до головного меню.');

    await ctx.editMessageText(
      'Оберіть одну з опцій:',
      Markup.inlineKeyboard([
        [
          Markup.button.callback('Допомога', 'help_action'),
          Markup.button.callback('About', 'about_action'),
        ],
        [Markup.button.callback('Закрити меню', 'close_action')],
      ]),
    );
  });
}
}
