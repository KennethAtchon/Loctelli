import { test, expect, describe, beforeEach, afterEach, mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { GhlApiClientService } from '../../integrations/ghl-integrations/ghl/ghl-api-client.service';
import { NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
mock.module('bcrypt', () => ({
  hash: mock(() => {}),
  compare: mock(() => {}),
}));

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;
  let ghlApiClientService: GhlApiClientService;

  const mockPrismaService = {
    user: {
      create: mock(() => {}),
      findMany: mock(() => {}),
      findUnique: mock(() => {}),
      findFirst: mock(() => {}),
      update: mock(() => {}),
      delete: mock(() => {}),
    },
    subAccount: {
      findFirst: mock(() => {}),
    },
  };

  const mockGhlApiClientService = {
    searchSubaccounts: mock(() => {}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: GhlApiClientService,
          useValue: mockGhlApiClientService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
    ghlApiClientService = module.get<GhlApiClientService>(GhlApiClientService);
  });

  afterEach(() => {
    // Clear all mocks
    Object.values(mockPrismaService.user).forEach((fn: any) =>
      fn.mockClear?.(),
    );
    mockPrismaService.subAccount.findFirst.mockClear?.();
    mockGhlApiClientService.searchSubaccounts.mockClear?.();
  });

  test('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      company: 'Test Company',
      role: 'user',
    };

    const mockCreatedUser = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedPassword',
      company: 'Test Company',
      role: 'user',
    };

    test('should successfully create a user with hashed password', async () => {
      (bcrypt.hash as any).mockResolvedValue('hashedPassword');
      mockPrismaService.user.create.mockResolvedValue(mockCreatedUser);

      const result = await service.create(createUserDto, 1);

      expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 12);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          ...createUserDto,
          password: 'hashedPassword',
          subAccountId: 1,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          company: true,
          isActive: true,
          subAccount: {
            select: { id: true, name: true },
          },
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(mockCreatedUser);
    });

    test('should create user without password hashing when password is empty string', async () => {
      const createUserDtoWithoutPassword = {
        name: 'Test User',
        email: 'test@example.com',
        password: '',
        company: 'Test Company',
        role: 'user',
      };

      mockPrismaService.user.create.mockResolvedValue(mockCreatedUser);

      const result = await service.create(createUserDtoWithoutPassword, 1);

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          ...createUserDtoWithoutPassword,
          subAccountId: 1,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          company: true,
          isActive: true,
          subAccount: {
            select: { id: true, name: true },
          },
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(mockCreatedUser);
    });
  });

  describe('findAll', () => {
    const mockUsers = [
      {
        id: 1,
        name: 'User 1',
        email: 'user1@example.com',
        strategies: [],
        leads: [],
        bookings: [],
      },
      {
        id: 2,
        name: 'User 2',
        email: 'user2@example.com',
        strategies: [],
        leads: [],
        bookings: [],
      },
    ];

    test('should return all users with related data', async () => {
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        include: {
          strategies: true,
          leads: true,
          bookings: true,
        },
      });
      expect(result).toEqual(mockUsers);
    });
  });

  describe('findOne', () => {
    const mockUser = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      strategies: [],
      leads: [],
      bookings: [],
    };

    test('should return user with related data when user exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          strategies: true,
          leads: true,
          bookings: true,
        },
      });
      expect(result).toEqual(mockUser);
    });

    test('should throw NotFoundException when user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
        include: {
          strategies: true,
          leads: true,
          bookings: true,
        },
      });
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      name: 'Updated User',
      company: 'Updated Company',
    };

    const mockUpdatedUser = {
      id: 1,
      name: 'Updated User',
      email: 'test@example.com',
      company: 'Updated Company',
    };

    test('should successfully update user when user exists', async () => {
      mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await service.update(1, updateUserDto);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateUserDto,
      });
      expect(result).toEqual(mockUpdatedUser);
    });

    test('should throw NotFoundException when user does not exist', async () => {
      mockPrismaService.user.update.mockRejectedValue(
        new Error('User not found'),
      );

      await expect(service.update(999, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 999 },
        data: updateUserDto,
      });
    });
  });

  describe('remove', () => {
    const mockDeletedUser = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
    };

    test('should successfully delete user when user exists', async () => {
      mockPrismaService.user.delete.mockResolvedValue(mockDeletedUser);

      const result = await service.remove(1);

      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockDeletedUser);
    });

    test('should throw NotFoundException when user does not exist', async () => {
      mockPrismaService.user.delete.mockRejectedValue(
        new Error('User not found'),
      );

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });
  });

  describe('importGhlUsers', () => {
    const mockSubaccountsData = {
      locations: [
        {
          name: 'Location 1',
          companyId: 'company1',
          email: 'location1@example.com',
        },
        {
          name: 'Location 2',
          companyId: 'company2',
          email: 'location2@example.com',
        },
      ],
    };

    const mockCreatedUsers = [
      {
        id: 1,
        name: 'Location 1',
        email: 'location1@example.com',
        company: 'company1',
        role: 'user',
      },
      {
        id: 2,
        name: 'Location 2',
        email: 'location2@example.com',
        company: 'company2',
        role: 'user',
      },
    ];

    test('should successfully import GHL users', async () => {
      mockGhlApiClientService.searchSubaccounts.mockResolvedValue(
        mockSubaccountsData,
      );
      mockPrismaService.subAccount.findFirst.mockResolvedValue({
        id: 1,
        name: 'Default SubAccount',
      });
      mockPrismaService.user.findFirst.mockResolvedValue(null); // No existing users
      (bcrypt.hash as any).mockResolvedValue('hashedPassword');
      mockPrismaService.user.create
        .mockResolvedValueOnce(mockCreatedUsers[0])
        .mockResolvedValueOnce(mockCreatedUsers[1]);

      const result = await service.importGhlUsers();

      expect(mockGhlApiClientService.searchSubaccounts).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('defaultPassword123', 12);
      expect(mockPrismaService.user.create).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockCreatedUsers);
    });

    test('should skip existing users during import', async () => {
      mockGhlApiClientService.searchSubaccounts.mockResolvedValue(
        mockSubaccountsData,
      );
      mockPrismaService.subAccount.findFirst.mockResolvedValue({
        id: 1,
        name: 'Default SubAccount',
      });
      mockPrismaService.user.findFirst
        .mockResolvedValueOnce(null) // First user doesn't exist
        .mockResolvedValueOnce({ id: 1, email: 'location2@example.com' }); // Second user exists
      (bcrypt.hash as any).mockResolvedValue('hashedPassword');
      mockPrismaService.user.create.mockResolvedValue(mockCreatedUsers[0]);

      const result = await service.importGhlUsers();

      expect(mockPrismaService.user.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockCreatedUsers[0]]);
    });

    test('should handle locations without email', async () => {
      const subaccountsDataWithoutEmail = {
        locations: [
          {
            name: 'Location 1',
            companyId: 'company1',
            // No email
          },
        ],
      };

      mockGhlApiClientService.searchSubaccounts.mockResolvedValue(
        subaccountsDataWithoutEmail,
      );
      mockPrismaService.subAccount.findFirst.mockResolvedValue({
        id: 1,
        name: 'Default SubAccount',
      });
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      (bcrypt.hash as any).mockResolvedValue('hashedPassword');
      mockPrismaService.user.create.mockResolvedValue({
        id: 1,
        name: 'Location 1',
        email: expect.stringMatching(/user-\d+@example\.com/),
        company: 'company1',
        role: 'user',
      });

      const result = await service.importGhlUsers();

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Location 1',
          email: expect.stringMatching(/user-\d+@example\.com/),
          company: 'company1',
          role: 'user',
        }),
      });
    });

    test('should throw HttpException when GHL API fails', async () => {
      mockGhlApiClientService.searchSubaccounts.mockResolvedValue(null);

      await expect(async () => {
        await service.importGhlUsers();
      }).toThrow();
      expect(mockGhlApiClientService.searchSubaccounts).toHaveBeenCalled();
    });

    test('should throw HttpException when GHL API returns no locations', async () => {
      mockGhlApiClientService.searchSubaccounts.mockResolvedValue({
        locations: null,
      });

      await expect(async () => {
        await service.importGhlUsers();
      }).toThrow();
    });

    test('should handle and rethrow HttpException from GHL service', async () => {
      const httpException = new HttpException(
        'GHL API Error',
        HttpStatus.BAD_GATEWAY,
      );
      mockGhlApiClientService.searchSubaccounts.mockRejectedValue(
        httpException,
      );

      await expect(async () => {
        await service.importGhlUsers();
      }).toThrow();
    });

    test('should handle and wrap other errors', async () => {
      const error = new Error('Database connection failed');
      mockGhlApiClientService.searchSubaccounts.mockRejectedValue(error);

      await expect(async () => {
        await service.importGhlUsers();
      }).toThrow();
    });
  });
});
