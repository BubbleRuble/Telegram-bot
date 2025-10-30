import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [AdminController],
})
export class AdminModule {}
