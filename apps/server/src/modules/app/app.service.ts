import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  heartbeat(): string {
    return 'ok';
  }
}
