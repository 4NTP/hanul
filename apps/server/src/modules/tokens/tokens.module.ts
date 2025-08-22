import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TokensService } from './tokens.service';
import { DbModule } from '../db/db.module';
import { TokensController } from './tokens.controller';

@Module({
  imports: [JwtModule.register({}), DbModule],
  controllers: [TokensController],
  providers: [TokensService],
})
export class TokensModule {}
