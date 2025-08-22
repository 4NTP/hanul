import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { DbService } from '../db/db.service';
import bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let dbService: jest.Mocked<DbService>;

  const mockUser = {
    id: 'user-id-123',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockDbService = {
      user: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: DbService,
          useValue: mockDbService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    dbService = module.get(DbService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should create a new user with hashed password', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'plainPassword123',
      };

      const salt = 'mock-salt';
      const hashedPassword = 'hashed-password';

      (bcrypt.genSalt as jest.Mock).mockResolvedValue(salt);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      dbService.user.create.mockResolvedValue(mockUser);

      const result = await service.signUp(
        userData.name,
        userData.email,
        userData.password,
      );

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, salt);
      expect(dbService.user.create).toHaveBeenCalledWith({
        data: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw error when database operation fails', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'plainPassword123',
      };

      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      dbService.user.create.mockRejectedValue(new Error('Database error'));

      await expect(
        service.signUp(userData.name, userData.email, userData.password),
      ).rejects.toThrow('Database error');
    });

    it('should throw error when bcrypt operations fail', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'plainPassword123',
      };

      (bcrypt.genSalt as jest.Mock).mockRejectedValue(
        new Error('Bcrypt error'),
      );

      await expect(
        service.signUp(userData.name, userData.email, userData.password),
      ).rejects.toThrow('Bcrypt error');
    });
  });
});
