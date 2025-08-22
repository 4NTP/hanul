import { z } from 'zod';
import { createApiResponseDto } from '@/types/api-response/api-response';
import { createZodDto } from 'nestjs-zod';

export const UsersSignUpRequestDtoSchema = z.object({
  name: z.string().min(1).describe('User name'),
  email: z.email().describe('User email'),
  password: z.string().min(8).describe('User password'),
});

export class UsersSignUpRequestDto extends createZodDto(
  UsersSignUpRequestDtoSchema,
) {}

export const UsersSignUpResponseDtoSchema = z.object({
  userId: z.string().describe('User ID'),
});

export class UsersSignUpResponseDto extends createApiResponseDto(
  UsersSignUpResponseDtoSchema,
) {}
