import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Observable } from 'rxjs';
import { Env } from '../config/env.schema';
import { DbService } from '../db/db.service';
import { availableTools } from './tools';
import { fetchData } from './tools/http/fetch';
import { executeWebSearch } from './tools/web/web-search';

@Injectable()
export class AIService {
  private openai: OpenAI;
  private readonly availableFunctions = {
    web_search: (args) => {
      executeWebSearch(
        this.configService.get('SURF_API_URL') || 'http://localhost:8000',
        this.configService.get('SURF_API_KEY') || 'LOCAL_SURF_API_KEY',
        args,
      );
    },
    fetch: fetchData,
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
        // tool 메시지에는 tool_call_id가 필수입니다
        return {
          role: history.role as 'tool',
          content: history.content,
          tool_call_id: history.toolCallId || '', // DB에서 toolCallId 필드가 있어야 합니다
        };
      } else {
        // user와 assistant 메시지는 기존 형식대로
        return {
          role: history.role as 'user' | 'assistant',
          content: history.content,
        };
      }
    });
    historyMessages.push({ role: 'user', content: prompt });

    return new Observable((observer) => {
      // 도구 호출 정보를 누적하기 위한 객체
      const accumulatedToolCalls = new Map();

      this.openai.chat.completions
        .create({
          model: 'solar-pro2',
          messages: historyMessages,
          tools: availableTools,
          tool_choice: 'auto',
          stream: true,
        })
        .then(async (res) => {
          let response = '';
          let isToolCallComplete = false;

          for await (const chunk of res) {
            const responseNext = chunk.choices[0]?.delta;
            const toolCalls = responseNext?.tool_calls;

            if (toolCalls) {
              for (const toolCall of toolCalls) {
                // 인덱스를 키로 사용하여 도구 호출 정보 누적
                const index = toolCall.index || 0;

                if (!accumulatedToolCalls.has(index)) {
                  accumulatedToolCalls.set(index, {
                    id: toolCall.id || `temp-id-${index}`,
                    function: { name: '', arguments: '' },
                  });
                }

                // 기존 정보 업데이트
                const current = accumulatedToolCalls.get(index);

                if (toolCall.function?.name) {
                  current.function.name = toolCall.function.name;
                }

                if (toolCall.function?.arguments) {
                  current.function.arguments += toolCall.function.arguments;
                }

                if (toolCall.id) {
                  current.id = toolCall.id;
                }

                // 도구 호출 정보가 완성되었는지 확인
                if (
                  current.function.name &&
                  current.function.arguments &&
                  current.id
                ) {
                  try {
                    const functionName = current.function.name;
                    const functionToCall =
                      this.availableFunctions[functionName];

                    if (functionToCall) {
                      const functionArgs = JSON.parse(
                        current.function.arguments,
                      );
                      const functionResponse =
                        await functionToCall(functionArgs);

                      historyMessages.push({
                        role: 'tool',
                        tool_call_id: current.id,
                        content: functionResponse,
                      });

                      isToolCallComplete = true;

                      // 도구 응답이 완성되면 바로 후속 응답 요청
                      const secondResponse =
                        await this.openai.chat.completions.create({
                          model: 'solar-pro2',
                          messages: historyMessages,
                        });

                      response +=
                        secondResponse.choices[0]?.message?.content || '';
                      observer.next(
                        secondResponse.choices[0]?.message?.content || '',
                      );

                      // 이미 처리한 도구 호출은 제거
                      accumulatedToolCalls.delete(index);
                    }
                  } catch (error) {
                    console.error('도구 호출 처리 오류:', error);
                  }
                }
              }
            } else {
              response += responseNext?.content || '';
              observer.next(responseNext?.content || '');
            }
          }
          observer.complete();
          await this.db.chat.update({
            where: { id: chat.id },
            data: {
              histories: {
                create: [
                  {
                    role: 'assistant',
                    content: response,
                  },
                ],
              },
            },
          });
        })
        .catch((err) => {
          observer.error(err);
        });
    });
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
        };
      } else {
        // user와 assistant 메시지는 기존 형식대로
        return {
          role: history.role as 'user' | 'assistant',
          content: history.content,
        };
      }
    });

    return new Observable((observer) => {
      observer.next(JSON.stringify({ id: newChat.id }));

      // 도구 호출 정보를 누적하기 위한 객체
      const accumulatedToolCalls = new Map();

      this.openai.chat.completions
        .create({
          model: 'solar-pro2',
          messages: historyMessages,
          tools: availableTools,
          tool_choice: 'auto',
          stream: true,
        })
        .then(async (res) => {
          let response = '';
          let isToolCallComplete = false;

          for await (const chunk of res) {
            const responseNext = chunk.choices[0]?.delta;
            const toolCalls = responseNext?.tool_calls;

            if (toolCalls) {
              for (const toolCall of toolCalls) {
                // 인덱스를 키로 사용하여 도구 호출 정보 누적
                const index = toolCall.index || 0;

                if (!accumulatedToolCalls.has(index)) {
                  accumulatedToolCalls.set(index, {
                    id: toolCall.id || `temp-id-${index}`,
                    function: { name: '', arguments: '' },
                  });
                }

                // 기존 정보 업데이트
                const current = accumulatedToolCalls.get(index);

                if (toolCall.function?.name) {
                  current.function.name = toolCall.function.name;
                }

                if (toolCall.function?.arguments) {
                  current.function.arguments += toolCall.function.arguments;
                }

                if (toolCall.id) {
                  current.id = toolCall.id;
                }

                // 도구 호출 정보가 완성되었는지 확인
                if (
                  current.function.name &&
                  current.function.arguments &&
                  current.id
                ) {
                  try {
                    const functionName = current.function.name;
                    const functionToCall =
                      this.availableFunctions[functionName];

                    if (functionToCall) {
                      const functionArgs = JSON.parse(
                        current.function.arguments,
                      );

                      const functionResponse =
                        await functionToCall(functionArgs);

                      historyMessages.push({
                        role: 'tool',
                        name: current.function.name,
                        tool_call_id: current.id,
                        content: JSON.stringify(functionResponse),
                      });

                      isToolCallComplete = true;

                      // 도구 응답이 완성되면 바로 후속 응답 요청
                      const secondResponse =
                        await this.openai.chat.completions.create({
                          model: 'solar-pro2',
                          messages: historyMessages,
                          tools: availableTools,
                          tool_choice: 'auto',
                        });

                      response +=
                        secondResponse.choices[0]?.message?.content || '';
                      observer.next(
                        secondResponse.choices[0]?.message?.content || '',
                      );

                      // 이미 처리한 도구 호출은 제거
                      accumulatedToolCalls.delete(index);
                    }
                  } catch (error) {
                    console.error('도구 호출 처리 오류:', error);
                  }
                }
              }
            } else {
              response += responseNext?.content || '';
              observer.next(responseNext?.content || '');
            }
          }
          observer.complete();
        })
        .catch((err) => {
          observer.error(err);
        });
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
