import { Module } from '@nestjs/common';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';
import { DbModule } from '../db/db.module';
import { TokensModule } from '../tokens/tokens.module';

@Module({
  imports: [DbModule, TokensModule],
  controllers: [AIController],
  providers: [AIService],
  exports: [AIService],
})
export class AIModule {}
