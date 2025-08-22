import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AIService {
  private openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('SOLAR_API_KEY'),
      baseURL: 'https://api.upstage.ai/v1',
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
