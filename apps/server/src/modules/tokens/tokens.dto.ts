import { z } from 'zod';
import { createApiResponseDto } from '@/types/api-response/api-response';
import { createZodDto } from 'nestjs-zod';

export const TokensSignInRequestDtoSchema = z.object({
  email: z.email().describe('User email'),
  password: z.string().min(8).describe('User password'),
});

export class TokensSignInRequestDto extends createZodDto(
  TokensSignInRequestDtoSchema,
) {}

export const TokensSignInResponseDtoSchema = z.object({
  accessToken: z.string().describe('Access token'),
  refreshToken: z.string().describe('Refresh token'),
});

export class TokensSignInResponseDto extends createApiResponseDto(
  TokensSignInResponseDtoSchema,
) {}
