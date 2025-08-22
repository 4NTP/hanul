import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import {
  ApiResponse,
  createApiResponseDto,
} from '@/types/api-response/api-response';
import { AppHeartbeatResponseDto } from './app.dto';
import { ZodResponse } from 'nestjs-zod';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('heartbeat')
  @ZodResponse({
    status: 200,
    description: 'Get heartbeat',
    type: AppHeartbeatResponseDto,
  })
  heartbeat() {
    const message = this.appService.heartbeat();

    return ApiResponse.Ok(message);
  }
}
