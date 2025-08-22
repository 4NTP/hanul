import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { DbModule } from '../db/db.module';
import { UsersController } from './users.controller';

@Module({
  imports: [DbModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
