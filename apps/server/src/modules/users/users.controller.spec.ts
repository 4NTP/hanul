import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersSignUpRequestDto } from './users.dto';
import { ApiResponse } from '@/types/api-response/api-response';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  const mockUser = {
    id: 'user-id-123',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockUsersService = {
      signUp: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should create a new user and return success response', async () => {
      const signUpDto: UsersSignUpRequestDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      usersService.signUp.mockResolvedValue(mockUser);

      const result = await controller.signUp(signUpDto);

      expect(usersService.signUp).toHaveBeenCalledWith(
        signUpDto.name,
        signUpDto.email,
        signUpDto.password,
      );

      expect(result).toEqual(
        ApiResponse.Ok('User created', { userId: mockUser.id }),
      );
    });

    it('should throw error when service fails', async () => {
      const signUpDto: UsersSignUpRequestDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const serviceError = new Error('Service error');
      usersService.signUp.mockRejectedValue(serviceError);

      await expect(controller.signUp(signUpDto)).rejects.toThrow(
        'Service error',
      );

      expect(usersService.signUp).toHaveBeenCalledWith(
        signUpDto.name,
        signUpDto.email,
        signUpDto.password,
      );
    });

    it('should handle different user data correctly', async () => {
      const signUpDto: UsersSignUpRequestDto = {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        password: 'securePassword456',
      };

      const differentUser = {
        ...mockUser,
        id: 'user-id-456',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
      };

      usersService.signUp.mockResolvedValue(differentUser);

      const result = await controller.signUp(signUpDto);

      expect(usersService.signUp).toHaveBeenCalledWith(
        signUpDto.name,
        signUpDto.email,
        signUpDto.password,
      );

      expect(result).toEqual(
        ApiResponse.Ok('User created', { userId: differentUser.id }),
      );
    });
  });
});
