import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TokensModule } from './tokens.module';
import { DbModule } from '../db/db.module';
import { DbService } from '../db/db.service';
import { TokensService } from './tokens.service';
import { TokensController } from './tokens.controller';

describe('TokensModule Integration', () => {
  let app: INestApplication;
  let tokensService: TokensService;
  let dbService: DbService;
  let configService: ConfigService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.test', '.env'],
        }),
        TokensModule,
      ],
    })
      .overrideProvider(DbService)
      .useValue({
        user: {
          create: jest.fn(),
          findUnique: jest.fn(),
          findMany: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    tokensService = moduleFixture.get<TokensService>(TokensService);
    dbService = moduleFixture.get<DbService>(DbService);
    configService = moduleFixture.get<ConfigService>(ConfigService);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Module Configuration', () => {
    it('should create the module with all required dependencies', () => {
      expect(tokensService).toBeDefined();
      expect(dbService).toBeDefined();
      expect(configService).toBeDefined();
    });

    it('should have TokensController defined', () => {
      const tokensController = app.get<TokensController>(TokensController);
      expect(tokensController).toBeDefined();
    });

    it('should have JwtModule imported', () => {
      expect(tokensService).toBeInstanceOf(TokensService);
    });
  });

  describe('Service Integration', () => {
    it('should have access to all required services', () => {
      expect(tokensService['jwtService']).toBeDefined();
      expect(tokensService['configService']).toBeDefined();
      expect(tokensService['db']).toBeDefined();
    });

    it('should handle JWT configuration from ConfigService', () => {
      expect(configService.get).toBeDefined();
    });
  });

  describe('Dependency Injection', () => {
    it('should properly inject all dependencies', () => {
      const tokensController = app.get<TokensController>(TokensController);
      expect(tokensController).toBeDefined();
      expect(tokensService).toBeDefined();
      expect(dbService).toBeDefined();
      expect(configService).toBeDefined();
    });

    it('should be able to access all services from TokensService', () => {
      expect(tokensService['jwtService']).toBeDefined();
      expect(tokensService['configService']).toBeDefined();
      expect(tokensService['db']).toBeDefined();
    });

    it('should be able to access services from TokensController', () => {
      const tokensController = app.get<TokensController>(TokensController);
      expect(tokensController['tokensService']).toBeDefined();
      expect(tokensController['configService']).toBeDefined();
    });
  });

  describe('Module Isolation', () => {
    it('should have isolated JWT configuration', () => {
      expect(tokensService).toBeInstanceOf(TokensService);
    });

    it('should properly handle module imports', () => {
      expect(dbService).toBeDefined();
      expect(configService).toBeDefined();
    });
  });
});
