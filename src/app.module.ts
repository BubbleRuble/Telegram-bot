import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { PrismaModule } from './prisma/prisma.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { TelegramUserService } from './users/telegram-user.service';
import { TelegramSessionService } from './sessions/telegram-sessions.service';
import { BotModule } from './bot/bot.module';


@Module({
  imports: [ConfigModule.forRoot({
      isGlobal: true, 
    }), AuthModule, UsersModule, AdminModule, PrismaModule, BotModule],
  controllers: [AppController],
  providers: [AppService, JwtAuthGuard, TelegramUserService, TelegramSessionService,],
})
export class AppModule {}
