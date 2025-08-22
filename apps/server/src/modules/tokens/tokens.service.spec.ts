import { Test, TestingModule } from '@nestjs/testing';
import { TokensService } from './tokens.service';
import { DbService } from '../db/db.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ApiResponseError } from '@/types/api-response/api-response-error';
import bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('TokensService', () => {
  let service: TokensService;
  let dbService: jest.Mocked<DbService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser = {
    id: 'user-id-123',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockConfig = {
    JWT_ISSUER: '',
    JWT_SECRET: 'test-secret',
  };

  beforeEach(async () => {
    const mockDbService = {
      user: {
        findUnique: jest.fn(),
      },
    };

    const mockJwtService = {
      signAsync: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => mockConfig[key as keyof typeof mockConfig]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokensService,
        {
          provide: DbService,
          useValue: mockDbService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TokensService>(TokensService);
    dbService = module.get(DbService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    it('should return tokens when credentials are valid', async () => {
      const email = 'john@example.com';
      const password = 'plainPassword123';
      const mockAccessToken = 'mock-access-token';
      const mockRefreshToken = 'mock-refresh-token';

      dbService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync
        .mockResolvedValueOnce(mockAccessToken)
        .mockResolvedValueOnce(mockRefreshToken);

      const result = await service.signIn(email, password);

      expect(dbService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(result).toMatchObject({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        accessTokenExpiresIn: 7 * 60 * 60,
        refreshTokenExpiresIn: 7 * 24 * 60 * 60,
      });
    });

    it('should throw NotFound error when user does not exist', async () => {
      const email = 'nonexistent@example.com';
      const password = 'password123';

      dbService.user.findUnique.mockResolvedValue(null);

      await expect(service.signIn(email, password)).rejects.toThrow(
        ApiResponseError.NotFound('User not found'),
      );

      expect(dbService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw Unauthorized error when password is invalid', async () => {
      const email = 'john@example.com';
      const password = 'wrongPassword';

      dbService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.signIn(email, password)).rejects.toThrow(
        ApiResponseError.Unauthorized('Invalid password'),
      );

      expect(dbService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should create JWT tokens with correct payload structure', async () => {
      const email = 'john@example.com';
      const password = 'plainPassword123';
      const mockAccessToken = 'mock-access-token';
      const mockRefreshToken = 'mock-refresh-token';

      const fixedTime = Math.floor(Date.now() / 1000);
      jest.spyOn(Date, 'now').mockReturnValue(fixedTime * 1000);

      dbService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync
        .mockResolvedValueOnce(mockAccessToken)
        .mockResolvedValueOnce(mockRefreshToken);

      await service.signIn(email, password);

      const expectedAccessPayload = {
        iss: mockConfig.JWT_ISSUER,
        iat: fixedTime,
        exp: fixedTime + 7 * 60 * 60,
        sub: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      };

      const expectedRefreshPayload = {
        iss: mockConfig.JWT_ISSUER,
        iat: fixedTime,
        exp: fixedTime + 7 * 24 * 60 * 60,
        sub: mockUser.id,
      };

      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        expectedAccessPayload,
        {
          secret: mockConfig.JWT_SECRET,
        },
      );

      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        expectedRefreshPayload,
        {
          secret: mockConfig.JWT_SECRET,
        },
      );

      jest.restoreAllMocks();
    });

    it('should throw error when JWT signing fails', async () => {
      const email = 'john@example.com';
      const password = 'plainPassword123';

      dbService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync.mockRejectedValue(new Error('JWT signing failed'));

      await expect(service.signIn(email, password)).rejects.toThrow(
        'JWT signing failed',
      );
    });
  });
});
