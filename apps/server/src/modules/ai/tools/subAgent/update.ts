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
  { id, prompt }: { id: string; prompt: string },
) {
  const subAgent = await Db.subAgent.update({
    where: { id },
    data: { prompt },
  });
  return { subAgent };
}
