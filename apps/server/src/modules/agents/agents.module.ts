import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';

@Module({
  imports: [DbModule],
  controllers: [AgentsController],
  providers: [AgentsService],
})
export class AgentsModule {}
