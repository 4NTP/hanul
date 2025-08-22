import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { availableTools } from './tools';
import { Env } from '../config/env.schema';
import { ChatCompletionCreateParamsStreaming } from 'openai/resources/index';

@Injectable()
export class AIService {
  private openai: OpenAI;

  constructor(private readonly configService: ConfigService<Env>) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('SOLAR_API_KEY'),
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

  async generateWithTools(prompt: string): Promise<string> {
    const completion = await this.openai.chat.completions.create({
      model: 'solar-pro2',
      messages: [{ role: 'user', content: prompt }],
      tools: availableTools,
      stream: true,
    } as ChatCompletionCreateParamsStreaming);

    // const message = completion.choices[0]?.message;

    // if (message?.tool_calls) {
    //   // Handle tool calls
    //   const toolResults = await this.handleToolCalls(message.tool_calls);

    //   // Continue conversation with tool results
    //   const followUpCompletion = await this.openai.chat.completions.create({
    //     model: 'solar-pro2',
    //     messages: [
    //       { role: 'user', content: prompt },
    //       message,
    //       ...toolResults.map((result) => ({
    //         role: 'tool' as const,
    //         tool_call_id: result.tool_call_id,
    //         content: result.content,
    //       })),
    //     ],
    //   });

    return (
      // followUpCompletion.choices[0]?.message?.content ||
      'No response generated'
    );
    // }

    // return message?.content || 'No response generated';
  }

  // private async handleToolCalls(
  //   toolCalls: any[],
  // ): Promise<Array<{ tool_call_id: string; content: string }>> {
  //   const results = [];

  //   for (const toolCall of toolCalls) {
  //     const { id, function: func } = toolCall;
  //     const { name, arguments: args } = func;

  //     try {
  //       const parsedArgs = JSON.parse(args);
  //       let result = '';

  //       switch (name) {
  //         case 'web_search':
  //           const searchResults = await this.webSearchService.executeWebSearch(
  //             parsedArgs.query,
  //             parsedArgs.num_results || 5,
  //           );
  //           result = this.webSearchService.formatSearchResults(searchResults);
  //           break;

  //         case 'fetch':
  //           // Handle HTTP fetch tool (implementation needed)
  //           result = 'Fetch tool not yet implemented';
  //           break;

  //         default:
  //           result = `Unknown tool: ${name}`;
  //       }

  //       results.push({
  //         tool_call_id: id,
  //         content: result,
  //       });
  //     } catch (error) {
  //       results.push({
  //         tool_call_id: id,
  //         content: `Error executing ${name}: ${error.message}`,
  //       });
  //     }
  //   }

  //   return results;
  // }
}
