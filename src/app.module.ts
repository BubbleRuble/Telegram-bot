import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { PrismaModule } from './prisma/prisma.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { BotService } from './bot/bot.service';
import { TelegramUserService } from './users/telegram-user.service';
import { TelegramSessionService } from './sessions/telegram-sessions.service';


@Module({
  imports: [ConfigModule.forRoot({
      isGlobal: true, 
    }), AuthModule, UsersModule, AdminModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService, JwtAuthGuard, BotService, TelegramUserService, TelegramSessionService,],
})
export class AppModule {}
