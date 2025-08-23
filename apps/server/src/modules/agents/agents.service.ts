import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';

@Injectable()
export class AgentsService {
  constructor(private readonly db: DbService) {}

  async getAgentById(userId: string, id: string) {
    return await this.db.subAgent.findUnique({
      where: { id, chat: { authorId: userId }, deletedAt: null },
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
      where: { chat: { authorId: userId }, deletedAt: null },
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
      where: { chat: { authorId: userId }, deletedAt: null },
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
      where: { id, chat: { authorId: userId }, deletedAt: null },
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

  async deleteAgent(userId: string, id: string) {
    const agent = await this.db.subAgent.findFirst({
      where: { id, chat: { authorId: userId }, deletedAt: null },
      select: { id: true },
    });
    if (!agent) throw new NotFoundException('Agent not found');
    return await this.db.subAgent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getTrashedAgents(userId: string) {
    return await this.db.subAgent.findMany({
      where: { chat: { authorId: userId }, deletedAt: { not: null } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async restoreAgent(userId: string, id: string) {
    const agent = await this.db.subAgent.findFirst({
      where: { id, chat: { authorId: userId }, deletedAt: { not: null } },
      select: { id: true },
    });
    if (!agent) throw new NotFoundException('Agent not found');
    return await this.db.subAgent.update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}
