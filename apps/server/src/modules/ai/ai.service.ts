import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Observable } from 'rxjs';
import { DbService } from '../db/db.service';
import { availableTools } from './tools';
import { Env } from '../config/env.schema';
import { ChatCompletionCreateParamsStreaming } from 'openai/resources/index';

@Injectable()
export class AIService {
  private openai: OpenAI;
  history: any[] = [];

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

    const historyMessages = chat.histories.map((history) => ({
      role: history.role as 'user' | 'assistant',
      content: history.content,
    }));
    historyMessages.push({ role: 'user', content: prompt });

    return new Observable((observer) => {
      this.openai.chat.completions
        .create({
          model: 'solar-pro2',
          messages: historyMessages,
          stream: true,
        })
        .then(async (res) => {
          let response = '';
          for await (const chunk of res) {
            response += chunk.choices[0]?.delta?.content || '';
            observer.next(chunk.choices[0]?.delta?.content || '');
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

    const historyMessages = newChat.histories.map((history) => ({
      role: history.role as 'user' | 'assistant',
      content: history.content,
    }));

    return new Observable((observer) => {
      observer.next(JSON.stringify({ id: newChat.id }));
      this.openai.chat.completions
        .create({
          model: 'solar-pro2',
          messages: historyMessages,
          stream: true,
        })
        .then(async (res) => {
          let response = '';
          for await (const chunk of res) {
            response += chunk.choices[0]?.delta?.content || '';
            observer.next(chunk.choices[0]?.delta?.content || '');
          }
          observer.complete();
          await this.db.chat.update({
            where: { id: newChat.id },
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

  async generateText(prompt: string): Promise<string> {
    const chatChunks = await this.openai.chat.completions.create({
      model: 'solar-pro2',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });
    let response = '';
    for await (const chunk of chatChunks) {
      response += chunk.choices[0]?.delta?.content || '';
    }

    return response;
  }
}
