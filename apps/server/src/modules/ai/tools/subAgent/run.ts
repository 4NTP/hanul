import { DbService } from '@/modules/db/db.service';

export const subAgentRunTool = {
  type: 'function' as const,
  function: {
    name: 'run_sub_agent',
    description:
      "Execute a stored Sub Agent's prompt with a given input to produce an output. After running, ALWAYS post-process with LLM to synthesize specialized, user-ready results. Chain additional tools if the sub-agent output requires verification or enrichment.",
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The SubAgent id to run',
        },
        // prompt: {
        //   type: 'string',
        //   description: 'The prompt/instruction for the Sub Agent',
        // },
      },
      required: ['id'],
    },
  },
};

export async function RunSubAgent(Db: DbService, subAgentId: string) {
  const agent = await Db.subAgent.findUnique({
    where: { id: subAgentId },
  });
  if (!agent) {
    throw new Error(`SubAgent with id ${subAgentId} not found`);
  }

  return agent;
}
