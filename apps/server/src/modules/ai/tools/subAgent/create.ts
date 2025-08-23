import { DbService } from '@/modules/db/db.service';

export const subAgentCreateTool = {
  type: 'function' as const,
  function: {
    name: 'create_sub_agent',
    description: 'Create New Sub Agent That Handling Questions',
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description:
            'The Prompt For Sub Agent. Need About Problem And Resolve Scenario',
        },
      },
      required: ['prompt'],
    },
  },
};

export async function CreateSubAgent(
  Db: DbService,
  chatId,
  { prompt }: { prompt: string },
) {
  const subAgent = await Db.subAgent.create({
    data: { prompt, chat: { connect: { id: chatId } } },
  });
  return { subAgent };
}
