import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';

@Injectable()
export class AgentsService {
  constructor(private readonly db: DbService) {}

  async getAgentById(userId: string, id: string) {
    return await this.db.subAgent.findUnique({
      where: { id, chat: { authorId: userId } },
      include: {
        updateHistories: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  async getAllAgents(userId: string) {
    return await this.db.subAgent.findMany({
      where: { chat: { authorId: userId } },
      include: {
        chat: {
          select: {
            authorId: true,
          },
        },
        updateHistories: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  async getRecentChangedAgent(userId: string) {
    return await this.db.subAgent.findFirst({
      where: { chat: { authorId: userId } },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        chat: {
          select: {
            authorId: true,
          },
        },
      },
    });
  }

  async updateAgentPrompt(userId: string, id: string, prompt: string) {
    console.log('updateAgentPrompt', userId, id, prompt);
    return await this.db.subAgent.update({
      where: { id, chat: { authorId: userId } },
      data: { prompt },
      include: {
        updateHistories: {
          orderBy: { createdAt: 'desc' },
        },
        chat: {
          select: {
            authorId: true,
          },
        },
      },
    });
  }
}
