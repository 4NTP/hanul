import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Observable, Observer } from 'rxjs';
import { Env } from '../config/env.schema';
import { DbService } from '../db/db.service';
import { availableTools } from './tools';
import { fetchData } from './tools/http/fetch';
import { executeWebSearch } from './tools/web/web-search';
import { executeWebRead } from './tools/web/web-read';
import {
  executeSequentialThinking,
  sequentialThinkingTool,
} from './tools/think/sequential-thinking';

type ChatMessage = {
  role: 'user' | 'assistant' | 'tool' | 'system' | 'developer';
  content: string;
  tool_calls?: OpenAI.Chat.ChatCompletionMessageToolCall[];
  tool_call_id?: string;
  name?: string;
};

const defaultPrompt = `

`;

@Injectable()
export class AIService {
  private openai: OpenAI;
  private readonly logger = new Logger(AIService.name);
  private readonly availableFunctions = {
    fetch: fetchData,
    sequentialThinkingTool: executeSequentialThinking,
    web_read: async (args: { url: string }) => {
      return await executeWebRead(
        this.configService.get('SURF_API_URL') || 'http://localhost:8000',
        args,
      );
    },
    web_search: async (args: { query: string; num_results?: number }) => {
      return await executeWebSearch(
        this.configService.get('SURF_API_URL') || 'http://localhost:8000',
        args,
      );
    },
  };

  constructor(
    private readonly configService: ConfigService<Env>,
    private readonly db: DbService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('SOLAR_API_KEY'),
      baseURL: 'https://api.upstage.ai/v1',
    });
  }

  async continueChat(userName: string, chatId: string, prompt: string) {
    const user = await this.db.user.findFirst({
      where: { name: userName },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const chat = await this.db.chat.findFirst({
      where: { id: chatId, authorId: user.id },
      include: { histories: true },
    });
    if (!chat) {
      throw new UnauthorizedException('Chat not found');
    }

    // TODO 여기부터 트랜잭션
    await this.db.chat.update({
      where: { id: chat.id },
      data: {
        histories: {
          create: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
      },
    });

    const historyMessages = chat.histories.map((history) => {
      if (history.role === 'tool') {
        return {
          role: history.role as 'tool',
          content: history.content,
          tool_call_id: history.toolCallId || '',
        };
      } else {
        return {
          role: history.role as 'user' | 'assistant',
          content: history.content,
        };
      }
    });
    historyMessages.push({ role: 'user', content: prompt });

    return new Observable((observer) => {
      this.processConversation(historyMessages, observer, chat.id, 0).catch(
        (err) => observer.error(err),
      );
    });
  }

  private async processConversation(
    messages: ChatMessage[],
    observer: Observer<string>,
    chatId: string,
    totalTokens: number,
    maxIterations: number = 10,
    currentIteration: number = 0,
  ) {
    this.logger.log('current iter', currentIteration);
    this.logger.log('total tokens', totalTokens);
    // 최대 반복 또는 토큰 제한 체크
    if (currentIteration >= maxIterations || totalTokens > 50000) {
      observer.next('\n\n[대화가 제한에 도달하여 종료됩니다.]');
      observer.complete();
      return;
    }

    // 메시지 형식을 OpenAI 형식으로 변환
    const openaiMessages = messages.map((msg) => {
      const baseMsg: any = {
        role: msg.role,
        content: msg.content,
      };

      if (msg.tool_calls) {
        baseMsg.tool_calls = msg.tool_calls;
      }

      if (msg.tool_call_id) {
        baseMsg.tool_call_id = msg.tool_call_id;
      }

      if (msg.name) {
        baseMsg.name = msg.name;
      }

      return baseMsg;
    });

    const response = await this.openai.chat.completions.create({
      model: 'solar-pro2',
      messages: openaiMessages,
      tools: availableTools,
      tool_choice: 'auto',
    } as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming);

    const message = response.choices[0]?.message;
    const usage = response.usage;
    totalTokens += usage?.total_tokens || 0;
    this.logger.log('tool_calls:', message?.tool_calls);

    if (message?.tool_calls && message.tool_calls.length > 0) {
      // 도구 호출이 있는 경우
      const toolResults: ChatMessage[] = [];

      for (const toolCall of message.tool_calls) {
        try {
          if (toolCall.type === 'function' && toolCall.function) {
            const functionName = toolCall.function.name;
            const functionToCall = this.availableFunctions[functionName];

            if (functionToCall) {
              const functionArgs = JSON.parse(toolCall.function.arguments);
              const functionResponse = await functionToCall(functionArgs);

              toolResults.push({
                role: 'tool' as const,
                tool_call_id: toolCall.id,
                name: functionName,
                content: JSON.stringify(functionResponse),
              });
            }
          }
        } catch (error) {
          console.error('도구 호출 처리 오류:', error);
          if (toolCall.type === 'function' && toolCall.function) {
            toolResults.push({
              role: 'tool' as const,
              tool_call_id: toolCall.id,
              name: toolCall.function?.name || 'unknown',
              content: JSON.stringify({ error: '도구 호출 실패' }),
            });
          } else {
            toolResults.push({
              role: 'tool' as const,
              tool_call_id: toolCall.id,
              name: 'unknown',
              content: JSON.stringify({ error: '알 수 없는 도구 호출' }),
            });
          }
        }
      }

      // assistant 메시지와 tool 결과를 히스토리에 추가
      messages.push({
        role: 'assistant' as const,
        content: message.content || '',
        tool_calls: message.tool_calls,
      });
      messages.push(...toolResults);

      // 재귀적으로 다음 응답 처리
      await this.processConversation(
        messages,
        observer,
        chatId,
        totalTokens,
        maxIterations,
        currentIteration + 1,
      );
    } else {
      // 일반 텍스트 응답
      const content = message?.content || '';
      observer.next(content);
      observer.complete();

      // DB에 최종 응답 저장
      await this.db.chat.update({
        where: { id: chatId },
        data: {
          histories: {
            create: [
              {
                role: 'assistant',
                content,
              },
            ],
          },
        },
      });
    }
  }

  async startNewChat(userName: string, prompt: string) {
    if (!userName) {
      userName = 'string';
    }
    const user = await this.db.user.findFirst({
      where: { name: userName },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const newChat = await this.db.chat.create({
      data: {
        author: { connect: { id: user.id } },
        histories: {
          create: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
      },
      include: {
        histories: true,
      },
    });

    const historyMessages = newChat.histories.map((history) => {
      if (history.role === 'tool') {
        // tool 메시지에는 tool_call_id가 필수입니다
        return {
          role: history.role as 'tool',
          content: history.content,
          name: history.name,
          tool_call_id: history.toolCallId || '', // DB에서 toolCallId 필드가 있어야 합니다
        } as ChatMessage;
      } else {
        // user와 assistant 메시지는 기존 형식대로
        return {
          role: history.role as 'user' | 'assistant',
          content: history.content,
        } as ChatMessage;
      }
    });

    return new Observable((observer) => {
      observer.next(JSON.stringify({ id: newChat.id }));

      this.processConversation(historyMessages, observer, newChat.id, 0).catch(
        (err) => observer.error(err),
      );
    });
  }

  async getChattings(userName: string) {
    if (!userName) {
      userName = 'string';
    }
    const user = await this.db.user.findFirst({
      where: { name: userName },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return await this.db.chat.findMany({
      where: { authorId: user.id },
      include: { histories: true },
    });
  }
}
