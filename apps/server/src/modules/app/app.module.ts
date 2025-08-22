import {
  MiddlewareConsumer,
  Module,
  NestModule,
  LoggerService,
  Logger,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TokensModule } from '../tokens/tokens.module';
import { UsersModule } from '../users/users.module';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { LoggerMiddleware } from '@/common/logger.middleware';
import { envSchema } from '../config/env.schema';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env.local', '../../.env.dev', '../../.env'],
      validate: (config) => {
        const result = envSchema.safeParse(config);
        if (!result.success) {
          const issues = result.error.issues
            .map((i) => `${i.path.join('.')}: ${i.message}`)
            .join('\n');
          throw new Error(`Config validation error: ${issues}`);
        }
        return result.data;
      },
    }),
    TokensModule,
    UsersModule,
    AIModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    Logger,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
