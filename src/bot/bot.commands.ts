import { Telegraf, Context, Markup } from 'telegraf';

export const BOT_COMMANDS = [
  { command: 'start', description: 'Start the bot' },
  { command: 'ronaldo', description: 'Check bot football knowlenge' },
  { command: 'messi', description: 'Check bot knowlenge' },
  { command: 'roll', description: 'Roll the cube' },
  { command: 'lang', description: 'Set language, e.g. /lang en' },
  { command: 'gayness', description: 'Check your gayness percentage' },
  { command: 'menu', description: 'Show interactive  menu' },
];

export function registerBotCommands(bot: Telegraf<Context>) {
  bot.start(async (ctx) => {
    await ctx.reply(
      `Hello, ${ctx.from.username}!`,
      Markup.keyboard(['Меню']).resize().oneTime(false),
    );
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

  // bot.action('about_action', async (ctx) => {
  //   await ctx.reply(
  //     `Here you can see info about bot, Dmytro Shototam @shotofunny`,
  //   );
  // });

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

  //ACTIONS


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
