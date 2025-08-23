import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { createApiResponseDto } from '@/types/api-response/api-response';

export const UpdateAgentPromptRequestDtoSchema = z.object({
  prompt: z.string().min(1),
});

export class UpdateAgentPromptRequestDto extends createZodDto(
  UpdateAgentPromptRequestDtoSchema,
) {}

export const UpdateAgentPromptResponseDtoSchema = z.object({
  id: z.string(),
  prompt: z.string(),
});

export class UpdateAgentPromptResponseDto extends createApiResponseDto(
  UpdateAgentPromptResponseDtoSchema,
) {}
