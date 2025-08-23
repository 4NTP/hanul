import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AgentsService } from './agents.service';
import {
  UpdateAgentPromptRequestDto,
  UpdateAgentPromptResponseDto,
} from './agents.dto';
import { ZodResponse } from 'nestjs-zod';
import { ApiResponse } from '@/types/api-response/api-response';
import { TokensGuard } from '../tokens/tokens.guard';
import { CurrentUser } from '../users/users.decorator';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get(':id')
  @UseGuards(TokensGuard)
  async getOneAgent(@Param('id') id: string, @CurrentUser() user) {
    return await this.agentsService.getAgentById(user.sub, id);
  }

  @Get()
  @UseGuards(TokensGuard)
  async getAllAgents(@CurrentUser() user) {
    return await this.agentsService.getAllAgents(user.sub);
  }

  @Get('recent')
  @UseGuards(TokensGuard)
  async getRecentChangedAgent(@CurrentUser() user) {
    return await this.agentsService.getRecentChangedAgent(user.sub);
  }

  @Patch(':id')
  @UseGuards(TokensGuard)
  @ZodResponse({
    status: 200,
    description: 'Agent prompt updated',
    type: UpdateAgentPromptResponseDto,
  })
  async updateAgentPrompt(
    @CurrentUser() user,
    @Param('id') id: string,
    @Body() body: UpdateAgentPromptRequestDto,
  ) {
    return ApiResponse.Ok(
      'Agent prompt updated',
      await this.agentsService.updateAgentPrompt(user.sub, id, body.prompt),
    );
  }
}
