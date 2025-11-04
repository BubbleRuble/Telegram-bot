import { Injectable, Logger } from '@nestjs/common';
import { Telegraf, Context, Markup } from 'telegraf';
import { generateHelpMessage, sendMenu } from '../utils/keyboards.service';

@Injectable()
export class MenuActionsService {
  private readonly logger = new Logger(MenuActionsService.name);

  public register(bot: Telegraf<Context>) {
    this.logger.log('Registering menu actions...');

    bot.action('help_action', async (ctx) => {
      await ctx.answerCbQuery('Показую команди...');

      const helpMessage = generateHelpMessage();

      await ctx.editMessageText(
        helpMessage,
        Markup.inlineKeyboard([
          [Markup.button.callback('Повернутися до меню', 'back_to_menu')],
        ]),
      );
    });

    bot.action('about_action', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.reply(
        `Here you can see info about bot, Dmytro Shototam @shotofunny`,
      );
    });

    bot.action('close_action', async (ctx) => {
      await ctx.answerCbQuery('Меню закрито.');
      await ctx.deleteMessage().catch((err) => this.logger.warn(`Failed to delete message: ${err.message}`));
    });

    bot.action('back_to_menu', async (ctx) => {
      await ctx.answerCbQuery('Повертаємось до головного меню.');
      await sendMenu(ctx);
    });
  }
}
