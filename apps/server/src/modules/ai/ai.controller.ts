import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../users/users.decorator';
import { CreateTextRequestDto } from './ai.dto';
import { AIService } from './ai.service';
import { TokensGuard } from '../tokens/tokens.guard';

@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('chat/:id')
  @Sse()
  @UseGuards(TokensGuard)
  async continueChat(
    @CurrentUser() user,
    @Body() { prompt }: CreateTextRequestDto,
    @Param('id') chatId: string,
  ) {
    return await this.aiService.continueChat(user.id, chatId, prompt);
  }

  @Post('chat')
  @Sse()
  @UseGuards(TokensGuard)
  async createChat(
    @CurrentUser() user,
    @Body() { prompt }: CreateTextRequestDto,
  ) {
    return await this.aiService.startNewChat(user.sub, prompt);
  }

  @Get('chat')
  @UseGuards(TokensGuard)
  async getChats(@CurrentUser() user) {
    return await this.aiService.getChats(user?.sub);
  }

  @Get('chat/:id')
  @UseGuards(TokensGuard)
  async getChatHistories(@CurrentUser() user, @Param('id') chatId: string) {
    return await this.aiService.getChatHistories(user.sub, chatId);
  }

  @Get('agents')
  @UseGuards(TokensGuard)
  async getSubAgents(@CurrentUser() user) {
    return await this.aiService.getSubAgents(user.sub);
  }
}
