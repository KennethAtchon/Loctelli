import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const expectedUsers = [
        { id: 1, email: 'user1@example.com', name: 'User 1' },
        { id: 2, email: 'user2@example.com', name: 'User 2' },
      ];
      mockPrismaService.user.findMany.mockResolvedValue(expectedUsers);

      const result = await service.findAll();
      expect(result).toEqual(expectedUsers);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a user if it exists', async () => {
      const expectedUser = { id: 1, email: 'user1@example.com', name: 'User 1' };
      mockPrismaService.user.findUnique.mockResolvedValue(expectedUser);

      const result = await service.findOne(1);
      expect(result).toEqual(expectedUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });
  });

  describe('create', () => {
    it('should create and return a user', async () => {
      const createUserDto = { email: 'new@example.com', name: 'New User', password: 'password' };
      const createdUser = { id: 3, ...createUserDto };
      mockPrismaService.user.create.mockResolvedValue(createdUser);

      const result = await service.create(createUserDto);
      expect(result).toEqual(createdUser);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: createUserDto,
      });
    });
  });

  describe('update', () => {
    it('should update and return a user if it exists', async () => {
      const updateUserDto = { name: 'Updated User' };
      const updatedUser = { id: 1, email: 'user1@example.com', name: 'Updated User' };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(1, updateUserDto);
      expect(result).toEqual(updatedUser);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateUserDto,
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const updateUserDto = { name: 'Updated User' };
      mockPrismaService.user.update.mockRejectedValue(new Error());

      await expect(service.update(999, updateUserDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete and return a user if it exists', async () => {
      const deletedUser = { id: 1, email: 'user1@example.com', name: 'User 1' };
      mockPrismaService.user.delete.mockResolvedValue(deletedUser);

      const result = await service.remove(1);
      expect(result).toEqual(deletedUser);
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockPrismaService.user.delete.mockRejectedValue(new Error());

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
