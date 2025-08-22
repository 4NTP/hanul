import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import supertest from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/modules/app/app.module';
import { DbService } from '../src/modules/db/db.service';
import { ZodValidationPipe } from 'nestjs-zod';

describe('Users API (e2e)', () => {
  let app: INestApplication<App>;
  let dbService: DbService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
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
    app.useGlobalPipes(new ZodValidationPipe());
    dbService = moduleFixture.get<DbService>(DbService);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /users', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const mockCreatedUser = {
        id: 'user-123',
        name: userData.name,
        email: userData.email,
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (dbService.user.create as jest.Mock).mockResolvedValue(mockCreatedUser);

      const response = await supertest(app.getHttpServer())
        .post('/users')
        .send(userData)
        .expect(200);

      expect(response.body).toMatchObject({
        statusCode: 200,
        message: 'User created',
        data: {
          userId: mockCreatedUser.id,
        },
      });

      expect(dbService.user.create).toHaveBeenCalledWith({
        data: {
          name: userData.name,
          email: userData.email,
          password: expect.any(String), // bcrypt hashed password
        },
      });
    });

    it('should return 400 for invalid email format', async () => {
      const invalidUserData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123',
      };

      await supertest(app.getHttpServer())
        .post('/users')
        .send(invalidUserData)
        .expect(400);

      expect(dbService.user.create).not.toHaveBeenCalled();
    });

    it('should return 400 for short password', async () => {
      const invalidUserData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: '123', // Too short
      };

      await supertest(app.getHttpServer())
        .post('/users')
        .send(invalidUserData)
        .expect(400);

      expect(dbService.user.create).not.toHaveBeenCalled();
    });

    it('should return 400 for missing name', async () => {
      const invalidUserData = {
        email: 'john@example.com',
        password: 'password123',
      };

      await supertest(app.getHttpServer())
        .post('/users')
        .send(invalidUserData)
        .expect(400);

      expect(dbService.user.create).not.toHaveBeenCalled();
    });

    it('should return 400 for empty name', async () => {
      const invalidUserData = {
        name: '',
        email: 'john@example.com',
        password: 'password123',
      };

      await supertest(app.getHttpServer())
        .post('/users')
        .send(invalidUserData)
        .expect(400);

      expect(dbService.user.create).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      (dbService.user.create as jest.Mock).mockRejectedValue(
        new Error('Database connection failed'),
      );

      await supertest(app.getHttpServer())
        .post('/users')
        .send(userData)
        .expect(500);
    });

    it('should handle duplicate email constraint', async () => {
      const userData = {
        name: 'John Doe',
        email: 'existing@example.com',
        password: 'password123',
      };

      const duplicateError = new Error('Unique constraint failed');
      (duplicateError as any).code = 'P2002';
      (dbService.user.create as jest.Mock).mockRejectedValue(duplicateError);

      await supertest(app.getHttpServer())
        .post('/users')
        .send(userData)
        .expect(500);
    });

    it('should validate Content-Type header', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      await supertest(app.getHttpServer())
        .post('/users')
        .set('Content-Type', 'text/plain')
        .send(JSON.stringify(userData))
        .expect(400);
    });

    it('should handle malformed JSON', async () => {
      await supertest(app.getHttpServer())
        .post('/users')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);
    });
  });
});
