import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';

@Injectable()
export class AgentsService {
  constructor(private readonly db: DbService) {}

  async getAgentById(id: string) {
    return await this.db.subAgent.findUnique({
      where: { id },
      include: {
        histories: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async getAllAgents() {
    return await this.db.subAgent.findMany();
  }

  async getRecentChangedAgent() {
    return await this.db.subAgent.findFirst({
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }
}
