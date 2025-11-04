import { Telegraf, Context } from 'telegraf';
import { Injectable, Logger } from '@nestjs/common';
import { BaseCommandsService } from './commands/base-commands.service';
import { AdminCommandsService } from './commands/admin-commands.service';
import { MenuActionsService } from './actions/menu-action.service'
import { AdminActionsService } from './actions/admin.action.service';
import { BOT_COMMANDS } from './utils/keyboards.service'; 

export { BOT_COMMANDS }; 

@Injectable()
export class BotCommandsService {
  private readonly logger = new Logger(BotCommandsService.name);

  constructor(
    private readonly baseCommandsService: BaseCommandsService,
    private readonly adminCommandsService: AdminCommandsService,
    private readonly menuActionsService: MenuActionsService,
    private readonly adminActionsService: AdminActionsService,
  ) {}


  public register(bot: Telegraf<Context>) {
    this.logger.log('⚙️ Registering all bot commands and actions...');

    this.baseCommandsService.register(bot);
    this.adminCommandsService.register(bot);
    this.menuActionsService.register(bot);
    this.adminActionsService.register(bot);

    this.logger.log('✅ All bot modules registered.');
  }
}
