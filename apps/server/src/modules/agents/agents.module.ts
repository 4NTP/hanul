import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { TokensModule } from '../tokens/tokens.module';

@Module({
  imports: [DbModule, TokensModule],
  controllers: [AgentsController],
  providers: [AgentsService],
})
export class AgentsModule {}
