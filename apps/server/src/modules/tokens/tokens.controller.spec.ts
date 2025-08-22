import { Test, TestingModule } from '@nestjs/testing';
import { TokensController } from './tokens.controller';
import { TokensService } from './tokens.service';
import { ConfigService } from '@nestjs/config';
import { TokensSignInRequestDto } from './tokens.dto';
import { ApiResponse } from '@/types/api-response/api-response';
import { Response } from 'express';

describe('TokensController', () => {
  let controller: TokensController;
  let tokensService: jest.Mocked<TokensService>;
  let configService: jest.Mocked<ConfigService>;

  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    accessTokenExpiresIn: 25200, // 7 hours
    refreshTokenExpiresIn: 604800, // 7 days
  };

  beforeEach(async () => {
    const mockTokensService = {
      signIn: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TokensController],
      providers: [
        {
          provide: TokensService,
          useValue: mockTokensService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<TokensController>(TokensController);
    tokensService = module.get(TokensService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    it('should sign in user and set cookies in development', async () => {
      const signInDto: TokensSignInRequestDto = {
        email: 'john@example.com',
        password: 'password123',
      };

      const mockResponse = {
        cookie: jest.fn(),
      } as unknown as Response;

      configService.get.mockReturnValue('development');
      tokensService.signIn.mockResolvedValue(mockTokens);

      const result = await controller.signIn(signInDto, mockResponse);

      expect(tokensService.signIn).toHaveBeenCalledWith(
        signInDto.email,
        signInDto.password,
      );

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'accessToken',
        mockTokens.accessToken,
        {
          httpOnly: true,
          secure: false,
          maxAge: mockTokens.accessTokenExpiresIn,
        },
      );

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        mockTokens.refreshToken,
        {
          httpOnly: true,
          secure: false,
          maxAge: mockTokens.refreshTokenExpiresIn,
        },
      );

      expect(result).toEqual(
        ApiResponse.Ok('Tokens generated', {
          accessToken: mockTokens.accessToken,
          refreshToken: mockTokens.refreshToken,
        }),
      );
    });

    it('should sign in user and set secure cookies in production', async () => {
      const signInDto: TokensSignInRequestDto = {
        email: 'john@example.com',
        password: 'password123',
      };

      const mockResponse = {
        cookie: jest.fn(),
      } as unknown as Response;

      configService.get.mockReturnValue('production');
      tokensService.signIn.mockResolvedValue(mockTokens);

      await controller.signIn(signInDto, mockResponse);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'accessToken',
        mockTokens.accessToken,
        {
          httpOnly: true,
          secure: true,
          maxAge: mockTokens.accessTokenExpiresIn,
        },
      );

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        mockTokens.refreshToken,
        {
          httpOnly: true,
          secure: true,
          maxAge: mockTokens.refreshTokenExpiresIn,
        },
      );
    });

    it('should throw error when service fails', async () => {
      const signInDto: TokensSignInRequestDto = {
        email: 'john@example.com',
        password: 'wrongpassword',
      };

      const mockResponse = {
        cookie: jest.fn(),
      } as unknown as Response;

      const serviceError = new Error('Invalid credentials');
      tokensService.signIn.mockRejectedValue(serviceError);

      await expect(controller.signIn(signInDto, mockResponse)).rejects.toThrow(
        'Invalid credentials',
      );

      expect(tokensService.signIn).toHaveBeenCalledWith(
        signInDto.email,
        signInDto.password,
      );
      expect(mockResponse.cookie).not.toHaveBeenCalled();
    });

    it('should handle different email formats correctly', async () => {
      const signInDto: TokensSignInRequestDto = {
        email: 'test.user+tag@domain.co.uk',
        password: 'password123',
      };

      const mockResponse = {
        cookie: jest.fn(),
      } as unknown as Response;

      configService.get.mockReturnValue('development');
      tokensService.signIn.mockResolvedValue(mockTokens);

      await controller.signIn(signInDto, mockResponse);

      expect(tokensService.signIn).toHaveBeenCalledWith(
        signInDto.email,
        signInDto.password,
      );
    });

    it('should not expose expires times in response data', async () => {
      const signInDto: TokensSignInRequestDto = {
        email: 'john@example.com',
        password: 'password123',
      };

      const mockResponse = {
        cookie: jest.fn(),
      } as unknown as Response;

      configService.get.mockReturnValue('development');
      tokensService.signIn.mockResolvedValue(mockTokens);

      const result = await controller.signIn(signInDto, mockResponse);

      expect(result.data).not.toHaveProperty('accessTokenExpiresIn');
      expect(result.data).not.toHaveProperty('refreshTokenExpiresIn');
      expect(result.data).toEqual({
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      });
    });
  });
});
