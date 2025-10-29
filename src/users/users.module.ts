import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersService],
  providers: [UsersService],
})
export class UsersModule {}
