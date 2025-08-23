import { DbService } from '@/modules/db/db.service';

export const subAgentUpdateTool = {
  type: 'function' as const,
  function: {
    name: 'update_sub_agent',
    description: "Update an existing Sub Agent's prompt by id.",
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The SubAgent id to update',
        },
        prompt: {
          type: 'string',
          description: 'The new prompt for the Sub Agent',
        },
      },
      required: ['id', 'prompt'],
    },
  },
};

export async function UpdateSubAgent(
  Db: DbService,
  { name, prompt }: { name: string; prompt: string },
) {
  console.log(name);
  const subAgent = await Db.subAgent.findUnique({
    where: { id: name },
  });
  if (!subAgent) {
    throw new Error('SubAgent not found');
  }
  const result = await Db.subAgent.update({
    where: { id: name },
    data: { prompt: (subAgent.prompt += prompt) },
  });
  return { result };
}
