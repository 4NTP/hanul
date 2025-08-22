import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { utilities, WinstonModule } from 'nest-winston';
import winston from 'winston';
import { DateTime } from 'luxon';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import winstonDaily from 'winston-daily-rotate-file';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { Env } from './modules/config/env.schema';

const bootstrap = async () => {
  const logger = createLogger();
  const app = await NestFactory.create(AppModule, {
    logger: logger,
  });
  app.use(helmet());

  const configService = app.get<ConfigService<Env>>(ConfigService);
  const port = configService.get('PORT') ?? 3000;
  const corsOrigin: string | string[] =
    configService.get('CORS_ORIGIN')?.split(',') || 'http://localhost:3000';

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: '*',
  } as CorsOptions);

  createSwagger(app);

  await app.listen(port);
};

const createLogger = () => {
  const isDev = process.env.NODE_ENV === 'development';
  const devFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
      format: () => DateTime.now().toFormat('HH:mm:ss'),
    }),
    winston.format.ms(),
    utilities.format.nestLike('Hanul', {
      colors: true,
      prettyPrint: true,
    }),
  );
  const prodFormat = winston.format.combine(
    winston.format.uncolorize(),
    winston.format.timestamp({ format: () => DateTime.now().toISO() }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
  );
  const logger = WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        level: isDev ? 'debug' : 'info',
        format: isDev ? devFormat : prodFormat,
      }),
      new winstonDaily({
        level: 'info',
        datePattern: 'YYYY-MM-DD',
        dirname: 'logs',
        filename: '%DATE%.log',
        zippedArchive: true,
        maxFiles: '7d',
        format: prodFormat,
      }),
      new winstonDaily({
        level: 'error',
        datePattern: 'YYYY-MM-DD',
        dirname: 'logs',
        filename: '%DATE%.error.log',
        zippedArchive: true,
        maxFiles: '7d',
        format: prodFormat,
      }),
    ],
  });

  return logger;
};

const createSwagger = (app: INestApplication) => {
  const config = new DocumentBuilder()
    .setTitle('Hanul')
    .setDescription('Hanul API documentation')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  cleanupOpenApiDoc(document);
};

bootstrap();
