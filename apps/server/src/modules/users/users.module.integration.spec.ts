import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users.module';
import { DbModule } from '../db/db.module';
import { DbService } from '../db/db.service';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

describe('UsersModule Integration', () => {
  let app: INestApplication;
  let usersService: UsersService;
  let dbService: DbService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.test', '.env'],
        }),
        UsersModule,
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
    usersService = moduleFixture.get<UsersService>(UsersService);
    dbService = moduleFixture.get<DbService>(DbService);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Module Configuration', () => {
    it('should create the module with all required dependencies', () => {
      expect(usersService).toBeDefined();
      expect(dbService).toBeDefined();
    });

    it('should have UsersController defined', () => {
      const usersController = app.get<UsersController>(UsersController);
      expect(usersController).toBeDefined();
    });

    it('should inject DbService into UsersService', () => {
      expect(usersService).toBeInstanceOf(UsersService);
    });
  });

  describe('Service Integration', () => {
    it('should create user through service with mocked database', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (dbService.user.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await usersService.signUp(
        'Test User',
        'test@example.com',
        'password123',
      );

      expect(result).toEqual(mockUser);
      expect(dbService.user.create).toHaveBeenCalledWith({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password: expect.any(String), // bcrypt hashed password
        },
      });
    });
  });

  describe('Dependency Injection', () => {
    it('should properly inject all dependencies', () => {
      const usersController = app.get<UsersController>(UsersController);
      expect(usersController).toBeDefined();
      expect(usersService).toBeDefined();
      expect(dbService).toBeDefined();
    });

    it('should be able to access DbService from UsersService', () => {
      expect(usersService['db']).toBeDefined();
    });
  });
});
