import { Injectable, Logger } from '@nestjs/common';
import { Context, MiddlewareFn } from 'telegraf';
import { UserRole } from '@prisma/client';
import { TelegramUserService } from '../../users/telegram-user.service';

@Injectable()
export class RoleCheckService {
  private readonly logger = new Logger(RoleCheckService.name);

  constructor(private readonly telegramUserService: TelegramUserService) {}

  public async getRole(ctx: Context): Promise<UserRole | null> {
    const fromId = ctx.from?.id;
    if (!fromId) return null;

    try {
      const user = await this.telegramUserService.findByTelegramId(String(fromId));
      return user?.role || UserRole.USER;
    } catch (err) {
      this.logger.error(`Role check failed for ID ${fromId}: ${err}`);
      return null;
    }
  }
 
  public async isSuperAdmin(ctx: Context): Promise<boolean> {
    const role = await this.getRole(ctx);
    return role === UserRole.SUPERADMIN;
  }

 
  public async isAdmin(ctx: Context): Promise<boolean> {
    const role = await this.getRole(ctx);
    return role === UserRole.ADMIN || role === UserRole.SUPERADMIN;
  }

  
  public adminOnly: MiddlewareFn<Context> = async (ctx, next) => {
    const isAdmin = await this.isAdmin(ctx);
    if (!isAdmin) {
      await ctx.reply('🚫 Відмовлено в доступі. Тільки для адміністраторів.');
      return;
    }
    return next();
  };

 
  public superAdminOnly: MiddlewareFn<Context> = async (ctx, next) => {
    const isSuperAdmin = await this.isSuperAdmin(ctx);
    if (!isSuperAdmin) {
      await ctx.reply('🛑 Відмовлено в доступі. Тільки для Супер Адміністраторів.');
      return;
    }
    return next();
  };
}
