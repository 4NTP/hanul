import { DbService } from '@/modules/db/db.service';

export const subAgentFindTool = {
  type: 'function' as const,
  function: {
    name: 'find_sub_agent',
    description:
      'List all Sub Agents for this chat so the main agent can choose by name/prompt.',
    parameters: {
      type: 'object',
      properties: {
        chatId: {
          type: 'string',
          description:
            'Optional chat id. If omitted, the server will supply it.',
        },
      },
      required: [],
    },
  },
};

export async function FindSubAgents(Db: DbService, chatId?: string) {
  const subAgents = await Db.subAgent.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, prompt: true, createdAt: true },
  });
  console.log(subAgents);
  const items = subAgents.map((s) => ({
    id: s.id,
    name: s.name || null,
    promptPreview: s.prompt.slice(0, 200),
    createdAt: s.createdAt,
  }));
  return { subAgents: items };
}
