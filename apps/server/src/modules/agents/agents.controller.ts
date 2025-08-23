import { Controller, Get, Param } from '@nestjs/common';
import { AgentsService } from './agents.service';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get(':id')
  async getOneAgent(@Param('id') id: string) {
    return await this.agentsService.getAgentById(id);
  }

  @Get()
  async getAllAgents() {
    return await this.agentsService.getAllAgents();
  }
}
