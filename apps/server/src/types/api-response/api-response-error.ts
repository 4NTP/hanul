import { HttpException, HttpStatus } from '@nestjs/common';

export class ApiResponseError<
  T extends Record<string, unknown> | undefined,
> extends HttpException {
  constructor(statusCode: number, message: string, data?: T) {
    super({ statusCode, message, data }, statusCode);
  }

  static BadRequest<T extends Record<string, unknown> | undefined = undefined>(
    message = 'BadRequest',
    data?: T,
  ): ApiResponseError<T> {
    return new ApiResponseError<T>(HttpStatus.BAD_REQUEST, message, data);
  }

  static Unauthorized<
    T extends Record<string, unknown> | undefined = undefined,
  >(message = 'Unauthorized', data?: T): ApiResponseError<T> {
    return new ApiResponseError<T>(HttpStatus.UNAUTHORIZED, message, data);
  }

  static Forbidden<T extends Record<string, unknown> | undefined = undefined>(
    message = 'Forbidden',
    data?: T,
  ): ApiResponseError<T> {
    return new ApiResponseError<T>(HttpStatus.FORBIDDEN, message, data);
  }

  static NotFound<T extends Record<string, unknown> | undefined = undefined>(
    message = 'NotFound',
    data?: T,
  ): ApiResponseError<T> {
    return new ApiResponseError<T>(HttpStatus.NOT_FOUND, message, data);
  }

  static InternalServerError<
    T extends Record<string, unknown> | undefined = undefined,
  >(message = 'InternalServerError', data?: T): ApiResponseError<T> {
    return new ApiResponseError<T>(
      HttpStatus.INTERNAL_SERVER_ERROR,
      message,
      data,
    );
  }
}
