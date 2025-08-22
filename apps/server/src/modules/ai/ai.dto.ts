import { z } from 'zod';
import { createApiResponseDto } from '@/types/api-response/api-response';
import { createZodDto } from 'nestjs-zod';

export const CreateTextRequestDtoSchema = z.object({
  prompt: z.string().min(1).describe('prompt'),
});

export class CreateTextRequestDto extends createZodDto(
  CreateTextRequestDtoSchema,
) {}

export const CreateTextResponseDtoSchema = z.object({
  response: z.string().describe('Response'),
});

export class CreateTextResponseDto extends createApiResponseDto(
  CreateTextResponseDtoSchema,
) {}
