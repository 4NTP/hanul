import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';

@Injectable()
export class AgentsService {
  constructor(private readonly db: DbService) {}

  async getAgentById(id: string) {
    return await this.db.subAgent.findUnique({
      where: { id, deletedAt: null },
      include: {
        updateHistories: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async getAllAgents() {
    return await this.db.subAgent.findMany({
      where: { deletedAt: null },
    });
  }

  async getRecentChangedAgent() {
    return await this.db.subAgent.findFirst({
      where: { deletedAt: null },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async deleteAgent(id: string) {
    return await this.db.subAgent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
