import { HttpStatus } from '@nestjs/common';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const ApiResponseSchema = z.object({
  statusCode: z.number(),
  data: z.record(z.string(), z.unknown()).optional(),
  message: z.string(),
});

export const ApiResponseNoDataSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
});

export const createApiResponseDto = (schema: z.ZodTypeAny = z.NEVER) => {
  if (schema === z.NEVER) {
    return createZodDto(ApiResponseNoDataSchema);
  }
  return createZodDto(ApiResponseSchema.extend({ data: schema.optional() }));
};

export class ApiResponse<
  T extends Record<string, unknown> | undefined = undefined,
> {
  statusCode: number;
  message: string;
  data?: T;

  constructor(statusCode: number, message: string, data?: T) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }

  static Ok<T extends Record<string, unknown> | undefined = undefined>(
    message = 'Success',
    data?: T,
  ): ApiResponse<T> {
    return new ApiResponse<T>(HttpStatus.OK, message, data);
  }

  static Created<T extends Record<string, unknown> | undefined = undefined>(
    message = 'Created',
    data?: T,
  ): ApiResponse<T> {
    return new ApiResponse<T>(HttpStatus.CREATED, message, data);
  }
}
