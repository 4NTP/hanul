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
        name: {
          type: 'string',
          description: 'The Name For Sub Agent',
        },
      },
      required: ['prompt', 'name'],
    },
  },
};

export async function CreateSubAgent(
  Db: DbService,
  chatId: string,
  name: string,
  { prompt }: { prompt: string },
) {
  console.log(chatId, name, prompt);
  const subAgent = await Db.subAgent.upsert({
    where: { name },
    update: { prompt },
    create: { prompt, name, chat: { connect: { id: chatId } } },
  });
  return { subAgent };
}
