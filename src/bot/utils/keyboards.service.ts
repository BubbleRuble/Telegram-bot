import { Context, Markup } from 'telegraf';

export const BOT_COMMANDS = [
  { command: 'start', description: 'Start the bot' },
  { command: 'ronaldo', description: 'Check bot football knowlenge' },
  { command: 'messi', description: 'Check bot knowlenge' },
  { command: 'roll', description: 'Roll the cube' },
  { command: 'lang', description: 'Set language, e.g. /lang en' },
  { command: 'gayness', description: 'Check your gayness percentage' },
  { command: 'menu', description: 'Show interactive menu' },
];

const commonMenuButtons = [
  Markup.button.callback('Допомога', 'help_action'),
  Markup.button.callback('About', 'about_action'),
];

export function showSuperAdminMenu(ctx: Context) {
  const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('View Stats', 'ADMIN_STATS')],
      [Markup.button.callback('Manage Admins', 'SUPERADMIN_MANAGE')],
    ]);
    return ctx.reply('SuperAdmin Menu:', keyboard);

}

export function showAdminMenu(ctx: Context) {
  const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('View Stats', 'ADMIN_STATS')],
    ]);

  return ctx.reply('Admin Menu:', keyboard);
}

export const showUserMenu = (ctx: Context) => {
    const keyboard = Markup.keyboard(['Меню']).resize().oneTime(false)
    return ctx.reply('User Menu:', keyboard);
  };

export function sendMenu(ctx: Context) {
  return ctx.reply(
    'Оберіть одну з опцій:',
    Markup.inlineKeyboard([
      commonMenuButtons,
      [Markup.button.callback('Закрити меню', 'close_action')],
    ]),
  );
}

export function generateHelpMessage() {
  const lines = BOT_COMMANDS.map(
    (c) => `/${c.command} - ${c.description}`,
  ).join('\n');
  return `Доступні команди:\n${lines}`;
}
