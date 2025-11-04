import { Module } from '@nestjs/common';
import { AdminCommandsService } from './commands/admin-commands.service';
import { MenuActionsService } from './actions/menu-action.service';
import { BaseCommandsService } from './commands/base-commands.service';
import { RoleCheckService } from './utils/role-check.service';
import { BotService } from './bot.service';
import { BotCommandsService } from './bot.commands';
import { TelegramUserService } from 'src/users/telegram-user.service';
import { TelegramSessionService } from 'src/sessions/telegram-sessions.service';
import { AdminActionsService } from './actions/admin.action.service';


@Module({
  providers: [
    BotService,
    BotCommandsService,
    AdminCommandsService,
    AdminActionsService,
    MenuActionsService,
    AdminCommandsService,
    BaseCommandsService,
    RoleCheckService,
    TelegramUserService,       
    TelegramSessionService, 
  ],
  exports: [
    BotService,
    BotCommandsService,
    AdminCommandsService,
    MenuActionsService,
    AdminCommandsService,
    BaseCommandsService,
    RoleCheckService,
  ],
})
export class BotModule {}
