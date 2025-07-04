import { Test, TestingModule } from '@nestjs/testing';
import { StrategiesService } from './strategies.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('StrategiesService', () => {
  let service: StrategiesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    strategy: {
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
        StrategiesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<StrategiesService>(StrategiesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of strategies', async () => {
      const expectedStrategies = [
        { id: 1, name: 'Strategy 1', description: 'Description 1' },
        { id: 2, name: 'Strategy 2', description: 'Description 2' },
      ];
      mockPrismaService.strategy.findMany.mockResolvedValue(expectedStrategies);

      const result = await service.findAll();
      expect(result).toEqual(expectedStrategies);
      expect(mockPrismaService.strategy.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a strategy if it exists', async () => {
      const expectedStrategy = { id: 1, name: 'Strategy 1', description: 'Description 1' };
      mockPrismaService.strategy.findUnique.mockResolvedValue(expectedStrategy);

      const result = await service.findOne(1);
      expect(result).toEqual(expectedStrategy);
      expect(mockPrismaService.strategy.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException if strategy does not exist', async () => {
      mockPrismaService.strategy.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.strategy.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });
  });

  describe('create', () => {
    it('should create and return a strategy', async () => {
      const createStrategyDto = { name: 'New Strategy', description: 'New Description' };
      const createdStrategy = { id: 3, ...createStrategyDto };
      mockPrismaService.strategy.create.mockResolvedValue(createdStrategy);

      const result = await service.create(createStrategyDto);
      expect(result).toEqual(createdStrategy);
      expect(mockPrismaService.strategy.create).toHaveBeenCalledWith({
        data: createStrategyDto,
      });
    });
  });

  describe('update', () => {
    it('should update and return a strategy if it exists', async () => {
      const updateStrategyDto = { name: 'Updated Strategy' };
      const updatedStrategy = { id: 1, name: 'Updated Strategy', description: 'Description 1' };
      mockPrismaService.strategy.update.mockResolvedValue(updatedStrategy);

      const result = await service.update(1, updateStrategyDto);
      expect(result).toEqual(updatedStrategy);
      expect(mockPrismaService.strategy.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateStrategyDto,
      });
    });

    it('should throw NotFoundException if strategy does not exist', async () => {
      const updateStrategyDto = { name: 'Updated Strategy' };
      mockPrismaService.strategy.update.mockRejectedValue(new Error());

      await expect(service.update(999, updateStrategyDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete and return a strategy if it exists', async () => {
      const deletedStrategy = { id: 1, name: 'Strategy 1', description: 'Description 1' };
      mockPrismaService.strategy.delete.mockResolvedValue(deletedStrategy);

      const result = await service.remove(1);
      expect(result).toEqual(deletedStrategy);
      expect(mockPrismaService.strategy.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException if strategy does not exist', async () => {
      mockPrismaService.strategy.delete.mockRejectedValue(new Error());

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
