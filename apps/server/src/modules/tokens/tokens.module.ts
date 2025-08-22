import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TokensService } from './tokens.service';
import { DbModule } from '../db/db.module';
import { TokensController } from './tokens.controller';
import { TokensGuard } from './tokens.guard';

@Module({
  imports: [JwtModule.register({}), DbModule],
  controllers: [TokensController],
  providers: [TokensService, TokensGuard],
  exports: [TokensService, TokensGuard],
})
export class TokensModule {}
