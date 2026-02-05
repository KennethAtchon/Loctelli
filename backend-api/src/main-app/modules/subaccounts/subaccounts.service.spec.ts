/* eslint-disable @typescript-eslint/await-thenable */
import { test, expect, describe, beforeEach, afterEach, mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { SubAccountsService } from './subaccounts.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateSubAccountDto } from './dto/create-subaccount.dto';
import { UpdateSubAccountDto } from './dto/update-subaccount.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('SubAccountsService', () => {
  let service: SubAccountsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    subAccount: {
      create: mock(),
      findMany: mock(),
      findFirst: mock(),
      update: mock(),
      delete: mock(),
    },
    user: {
      findFirst: mock(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubAccountsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SubAccountsService>(SubAccountsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    // Bun mocks cleared automatically;
  });

  test('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    test('should create a new SubAccount', async () => {
      const adminId = 1;
      const createDto: CreateSubAccountDto = {
        name: 'Test SubAccount',
        description: 'Test description',
        settings: { test: 'value' },
      };

      const expectedResult = {
        id: 1,
        ...createDto,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdByAdminId: adminId,
        createdByAdmin: { id: adminId, name: 'Admin', email: 'admin@test.com' },
        _count: { users: 0, strategies: 0, leads: 0, bookings: 0 },
      } as any;

      mockPrismaService.subAccount.create.mockResolvedValue(expectedResult);

      const result = await service.create(adminId, createDto);

      expect(mockPrismaService.subAccount.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          createdByAdminId: adminId,
        },
        include: {
          createdByAdmin: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: {
              users: true,
              strategies: true,
              leads: true,
              bookings: true,
            },
          },
        },
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    test('should return all SubAccounts for an admin', async () => {
      const adminId = 1;
      const expectedResult = [
        {
          id: 1,
          name: 'Test SubAccount',
          createdByAdminId: adminId,
          createdByAdmin: {
            id: adminId,
            name: 'Admin',
            email: 'admin@test.com',
          },
          _count: { users: 0, strategies: 0, leads: 0, bookings: 0 },
        },
      ] as any;

      mockPrismaService.subAccount.findMany.mockResolvedValue(expectedResult);

      const result = await service.findAll(adminId);

      expect(mockPrismaService.subAccount.findMany).toHaveBeenCalledWith({
        include: {
          createdByAdmin: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: {
              users: true,
              strategies: true,
              leads: true,
              bookings: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    test('should return a SubAccount if found', async () => {
      const adminId = 1;
      const subAccountId = 1;
      const expectedResult = {
        id: subAccountId,
        name: 'Test SubAccount',
        createdByAdminId: adminId,
        createdByAdmin: { id: adminId, name: 'Admin', email: 'admin@test.com' },
        users: [],
        strategies: [],
        leads: [],
        bookings: [],
      } as any;

      mockPrismaService.subAccount.findFirst.mockResolvedValue(expectedResult);

      const result = await service.findOne(subAccountId, adminId);

      expect(mockPrismaService.subAccount.findFirst).toHaveBeenCalledWith({
        where: { id: subAccountId },
        include: {
          createdByAdmin: {
            select: { id: true, name: true, email: true },
          },
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              isActive: true,
              lastLoginAt: true,
              createdAt: true,
            },
          },
          strategies: {
            select: {
              id: true,
              name: true,
              tag: true,
              tone: true,
              createdAt: true,
            },
          },
          leads: {
            select: {
              id: true,
              name: true,
              email: true,
              status: true,
            },
          },
          bookings: {
            select: {
              id: true,
              bookingType: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });
      expect(result).toEqual(expectedResult);
    });

    test('should throw NotFoundException if SubAccount not found', async () => {
      const adminId = 1;
      const subAccountId = 999;

      mockPrismaService.subAccount.findFirst.mockResolvedValue(null);

      await expect(
        async () => await service.findOne(subAccountId, adminId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    test('should update a SubAccount if found', async () => {
      const adminId = 1;
      const subAccountId = 1;
      const updateDto: UpdateSubAccountDto = {
        name: 'Updated SubAccount',
        isActive: false,
      };

      const existingSubAccount = {
        id: subAccountId,
        name: 'Test SubAccount',
        createdByAdminId: adminId,
      } as any;

      const expectedResult = {
        ...existingSubAccount,
        ...updateDto,
        createdByAdmin: { id: adminId, name: 'Admin', email: 'admin@test.com' },
      };

      mockPrismaService.subAccount.findFirst.mockResolvedValue(
        existingSubAccount,
      );
      mockPrismaService.subAccount.update.mockResolvedValue(expectedResult);

      const result = await service.update(subAccountId, adminId, updateDto);

      expect(mockPrismaService.subAccount.update).toHaveBeenCalledWith({
        where: { id: subAccountId },
        data: updateDto,
        include: {
          createdByAdmin: {
            select: { id: true, name: true, email: true },
          },
        },
      });
      expect(result).toEqual(expectedResult);
    });

    test('should throw NotFoundException if SubAccount not found', async () => {
      const adminId = 1;
      const subAccountId = 999;
      const updateDto: UpdateSubAccountDto = { name: 'Updated' };

      mockPrismaService.subAccount.findFirst.mockResolvedValue(null);

      await expect(
        service.update(subAccountId, adminId, updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    test('should delete a SubAccount if found', async () => {
      const adminId = 1;
      const subAccountId = 1;

      const existingSubAccount = {
        id: subAccountId,
        name: 'Test SubAccount',
        createdByAdminId: adminId,
      } as any;

      mockPrismaService.subAccount.findFirst.mockResolvedValue(
        existingSubAccount,
      );
      mockPrismaService.subAccount.delete.mockResolvedValue({});

      const result = await service.remove(subAccountId, adminId);

      expect(mockPrismaService.subAccount.delete).toHaveBeenCalledWith({
        where: { id: subAccountId },
      });
      expect(result).toEqual({ message: 'SubAccount deleted successfully' });
    });

    test('should throw NotFoundException if SubAccount not found', async () => {
      const adminId = 1;
      const subAccountId = 999;

      mockPrismaService.subAccount.findFirst.mockResolvedValue(null);

      await expect(
        async () => await service.remove(subAccountId, adminId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateSubAccountAccess', () => {
    test('should validate admin access to SubAccount', async () => {
      const adminId = 1;
      const subAccountId = 1;

      const expectedSubAccount = {
        id: subAccountId,
        name: 'Test SubAccount',
        createdByAdminId: adminId,
      } as any;

      mockPrismaService.subAccount.findFirst.mockResolvedValue(
        expectedSubAccount,
      );

      const result = await service.validateSubAccountAccess(
        adminId,
        subAccountId,
        'admin',
      );

      expect(mockPrismaService.subAccount.findFirst).toHaveBeenCalledWith({
        where: { id: subAccountId },
      });
      expect(result).toEqual(expectedSubAccount);
    });

    test('should validate user access to SubAccount', async () => {
      const userId = 1;
      const subAccountId = 1;

      const expectedUser = {
        id: userId,
        name: 'Test User',
        subAccountId: subAccountId,
      } as any;

      mockPrismaService.user.findFirst.mockResolvedValue(expectedUser);

      const result = await service.validateSubAccountAccess(
        userId,
        subAccountId,
        'user',
      );

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { id: userId, subAccountId },
      });
      expect(result).toEqual(expectedUser);
    });

    test('should throw ForbiddenException for invalid admin access', async () => {
      const adminId = 1;
      const subAccountId = 1;

      mockPrismaService.subAccount.findFirst.mockResolvedValue(null);

      await expect(
        async () =>
          await service.validateSubAccountAccess(
            adminId,
            subAccountId,
            'admin',
          ),
      ).rejects.toThrow(ForbiddenException);
    });

    test('should throw ForbiddenException for invalid user access', async () => {
      const userId = 1;
      const subAccountId = 1;

      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        async () =>
          await service.validateSubAccountAccess(userId, subAccountId, 'user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
