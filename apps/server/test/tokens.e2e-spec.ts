import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/modules/app/app.module';
import { DbService } from '../src/modules/db/db.service';
import { ZodValidationPipe } from 'nestjs-zod';
import bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('Tokens API (e2e)', () => {
  let app: INestApplication<App>;
  let dbService: DbService;

  const mockUser = {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

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
    jest.clearAllMocks();
  });

  describe('POST /tokens', () => {
    it('should sign in user with valid credentials', async () => {
      const signInData = {
        email: 'john@example.com',
        password: 'password123',
      };

      (dbService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const response = await supertest(app.getHttpServer())
        .post('/tokens')
        .send(signInData)
        .expect(200);

      expect(response.body).toMatchObject({
        statusCode: 200,
        message: 'Tokens generated',
        data: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
      });

      expect(response.headers['set-cookie']).toEqual(
        expect.arrayContaining([
          expect.stringContaining('accessToken='),
          expect.stringContaining('refreshToken='),
        ]),
      );

      expect(dbService.user.findUnique).toHaveBeenCalledWith({
        where: { email: signInData.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        signInData.password,
        mockUser.password,
      );
    });

    it('should return 404 for non-existent user', async () => {
      const signInData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      (dbService.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await supertest(app.getHttpServer())
        .post('/tokens')
        .send(signInData)
        .expect(404);

      expect(response.body).toMatchObject({
        statusCode: 404,
        message: 'User not found',
      });

      expect(dbService.user.findUnique).toHaveBeenCalledWith({
        where: { email: signInData.email },
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid password', async () => {
      const signInData = {
        email: 'john@example.com',
        password: 'wrongpassword',
      };

      (dbService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const response = await supertest(app.getHttpServer())
        .post('/tokens')
        .send(signInData)
        .expect(401);

      expect(response.body).toMatchObject({
        statusCode: 401,
        message: 'Invalid password',
      });

      expect(dbService.user.findUnique).toHaveBeenCalledWith({
        where: { email: signInData.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        signInData.password,
        mockUser.password,
      );
    });

    it('should return 400 for invalid email format', async () => {
      const invalidSignInData = {
        email: 'invalid-email',
        password: 'password123',
      };

      await supertest(app.getHttpServer())
        .post('/tokens')
        .send(invalidSignInData)
        .expect(400);

      expect(dbService.user.findUnique).not.toHaveBeenCalled();
    });

    it('should return 400 for short password', async () => {
      const invalidSignInData = {
        email: 'john@example.com',
        password: '123', // Too short
      };

      await supertest(app.getHttpServer())
        .post('/tokens')
        .send(invalidSignInData)
        .expect(400);

      expect(dbService.user.findUnique).not.toHaveBeenCalled();
    });

    it('should return 400 for missing email', async () => {
      const invalidSignInData = {
        password: 'password123',
      };

      await supertest(app.getHttpServer())
        .post('/tokens')
        .send(invalidSignInData)
        .expect(400);

      expect(dbService.user.findUnique).not.toHaveBeenCalled();
    });

    it('should return 400 for missing password', async () => {
      const invalidSignInData = {
        email: 'john@example.com',
      };

      await supertest(app.getHttpServer())
        .post('/tokens')
        .send(invalidSignInData)
        .expect(400);

      expect(dbService.user.findUnique).not.toHaveBeenCalled();
    });

    it('should set secure cookies in production environment', async () => {
      process.env.NODE_ENV = 'production';

      const signInData = {
        email: 'john@example.com',
        password: 'password123',
      };

      (dbService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const response = await supertest(app.getHttpServer())
        .post('/tokens')
        .send(signInData)
        .expect(200);

      const setCookieHeaders = response.headers['set-cookie'];
      expect(setCookieHeaders).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Secure'),
          expect.stringContaining('HttpOnly'),
        ]),
      );

      process.env.NODE_ENV = 'test';
    });

    it('should handle database connection errors', async () => {
      const signInData = {
        email: 'john@example.com',
        password: 'password123',
      };

      (dbService.user.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection failed'),
      );

      await supertest(app.getHttpServer())
        .post('/tokens')
        .send(signInData)
        .expect(500);
    });

    it('should validate Content-Type header', async () => {
      const signInData = {
        email: 'john@example.com',
        password: 'password123',
      };

      await supertest(app.getHttpServer())
        .post('/tokens')
        .set('Content-Type', 'text/plain')
        .send(JSON.stringify(signInData))
        .expect(400);
    });

    it('should handle malformed JSON', async () => {
      await supertest(app.getHttpServer())
        .post('/tokens')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);
    });

    it('should not expose sensitive data in response', async () => {
      const signInData = {
        email: 'john@example.com',
        password: 'password123',
      };

      (dbService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const response = await supertest(app.getHttpServer())
        .post('/tokens')
        .send(signInData)
        .expect(200);

      expect(response.body.data).not.toHaveProperty('accessTokenExpiresIn');
      expect(response.body.data).not.toHaveProperty('refreshTokenExpiresIn');
      expect(response.body).not.toContain(mockUser.password);
      expect(response.body).not.toContain(mockUser.id);
    });
  });
});
