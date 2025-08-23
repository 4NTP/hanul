import { DbService } from '@/modules/db/db.service';

export const subAgentFindTool = {
  type: 'function' as const,
  function: {
    name: 'find_sub_agent',
    description: 'Find All Sub Agent That Main Agent Could Handle One.',
  },
};

export async function FindSubAgents(Db: DbService, chatId) {
  const subAgents = await Db.subAgent.findMany({
    where: { chatId },
  });
  return { subAgents };
}
