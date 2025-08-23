import { DbService } from '@/modules/db/db.service';

export const subAgentDeleteTool = {
  type: 'function' as const,
  function: {
    name: 'delete_sub_agent',
    description: 'Delete a Sub Agent by id.',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The SubAgent id to delete',
        },
      },
      required: ['id'],
    },
  },
};

export async function DeleteSubAgent(Db: DbService, { id }: { id: string }) {
  await Db.subAgent.delete({ where: { id } });
  return { ok: true };
}
