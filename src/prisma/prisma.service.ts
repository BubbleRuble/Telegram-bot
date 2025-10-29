import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private conected = false;
  constructor(private readonly configService: ConfigService) {
    const env = (
      configService.get<string>('NODE_ENV') || 'development'
    ).toLowerCase();

    super({
      log:
        env === 'production'
          ? ['warn', 'error']
          : ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    const skipConnect =
      this.configService.get<string>('PRISMA_SKIP_CONNECT') === 'true';

    if (!skipConnect) {
      return;
    }
    try {
      await this.$connect();
      this.connected = true;
    } catch (error) {
      throw new Error('connect error');
    }
  }

  async onModuleDestroy() {
    if (this.connected) {
      await this.$disconnect();
    }
  }
}
