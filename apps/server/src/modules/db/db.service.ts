import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@/generated/prisma';
import { Env } from '../config/env.schema';

@Injectable()
export class DbService extends PrismaClient {
  constructor(private readonly configService: ConfigService<Env>) {
    super({
      datasources: {
        db: {
          url: configService.get('DATABASE_URL'),
        },
      },
    });
  }
}
