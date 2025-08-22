import { Injectable } from '@nestjs/common';

@Injectable()
export class AIService {
  constructor() {}
  async generateText(prompt: string): Promise<string> {
    return `Generated text based on prompt: ${prompt}`;
  }
}
