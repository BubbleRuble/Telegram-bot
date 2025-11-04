import {
  INestApplication,
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramSessionService } from 'src/sessions/telegram-sessions.service';
import { TelegramUserService } from 'src/users/telegram-user.service';
import { Context, Telegraf, Markup, MiddlewareFn} from 'telegraf';
import { BOT_COMMANDS, BotCommandsService } from './bot.commands';
import { UserRole } from '@prisma/client';


@Injectable()
export class BotService implements OnModuleDestroy {
  private readonly logger = new Logger(BotService.name);
  private bot?: Telegraf<Context>;
  private mode: 'webhook' | 'polling' = 'polling';

  constructor(
    private configService: ConfigService,
    private readonly telegramUserService: TelegramUserService,
    private readonly telegramSessionService: TelegramSessionService,
    private readonly botCommands: BotCommandsService,
  ) {
    const token = this.configService.get('TELEGRAM_BOT_TOKEN');
    console.log('TELEGRAM_BOT_TOKEN:', token);
    if (!token) {
      this.logger.warn(
        'TELEGRAM_BOT_TOKEN (or BOT_TOKEN) not set. Bot is disabled.',
      );
      return;
    }

    this.bot = new Telegraf(token as string);

    this.bot.use((ctx, next) => {
      this.logger.log(`Update received from chat: ${ctx.chat?.id}`);
      void this.telegramUserService
        .upsertFromContext(ctx)
        .then((user) =>
          this.telegramSessionService.upsertFromContext(
            ctx,
            user ? (user.id as unknown as bigint) : undefined,
          ),
        )
        .catch((error) => {
          this.logger.debug(`Session upsert failed: ${String(error)}`);
        });
      return next();
    });
    
    this.botCommands.register(this.bot); 

    this.bot.command('lang', async (ctx) => {
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
  }

  async init(app: INestApplication) {
    if (!this.bot) {
      return;
    }
    await this.bot.telegram.setMyCommands(BOT_COMMANDS);

    const env = (
      process.env.NODE_ENV ||
      process.env.APP_ENV ||
      'development'
    ).toLowerCase();
    const isProduction = env === 'production';

    await this.bot.telegram.setMyCommands(this.getCommands());

    if (isProduction) {
      this.mode = 'webhook';

      const pathFromEnv =
        process.env.WEBHOOK_PATH ||
        process.env.TELEGRAM_WEBHOOK_PATH ||
        '/telegram/webhook';
      const webhookPath = pathFromEnv.startsWith('/')
        ? pathFromEnv
        : `/${pathFromEnv}`;

      const baseUrl = (
        process.env.WEBHOOK_URL ||
        process.env.HOST_URL ||
        ''
      ).replace(/\/$/, '');
      if (!baseUrl) {
        this.logger.error(
          'WEBHOOK_URL or HOST_URL is required in production for Telegram webhook.',
        );
        return;
      }

      const server = app
        .getHttpAdapter()
        .getInstance() as import('express').Application;
      const handler = this.bot.webhookCallback(webhookPath);
      server.post(webhookPath, handler);

      const webhookUrl = `${baseUrl}${webhookPath}`;
      await this.bot.telegram.setWebhook(webhookUrl);
      this.logger.log(`Telegram webhook registered: ${webhookUrl}`);
    } else {
      this.mode = 'polling';
      await this.bot.launch();
      this.logger.log('Telegram bot launched in long polling mode.');
    }

    process.once('SIGINT', () => {
      void this.stop('SIGINT');
    });
    process.once('SIGTERM', () => {
      void this.stop('SIGTERM');
    });
  }

  private async stop(signal: string) {
    if (!this.bot) return;
    if (this.mode === 'polling') {
      this.bot.stop(signal);
    } else {
      try {
        await this.bot.telegram.deleteWebhook();
      } catch {}
    }
  }

  async onModuleDestroy() {
    await this.stop('ModuleDestroy');
  }

  private getCommands(): { command: string; description: string }[] {
    return [
      { command: 'start', description: 'Start the bot' },
      { command: 'help', description: 'Show available commands' },
      { command: 'ronaldo', description: 'Check bot football knowlenge' },
      { command: 'messi', description: 'Check bot knowlenge' },
      { command: 'roll', description: 'Roll the cube' },
      { command: 'lang', description: 'Set language, e.g. /lang en' },
      { command: 'gayness', description: 'Check your gayness percentage' },
      { command: 'about', description: 'Info about bot ' },
      { command: 'inline_menu', description: 'Show interactive inline menu' }, 
    ];
  }
}
