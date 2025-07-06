import { Test, TestingModule } from '@nestjs/testing';
import { LeadsService } from './leads.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('LeadsService', () => {
  let service: LeadsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    client: {
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
        LeadsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of leads', async () => {
      const expectedLeads = [
        { id: 1, name: 'Lead 1', userId: 1, strategyId: 1 },
        { id: 2, name: 'Lead 2', userId: 1, strategyId: 2 },
      ];
      mockPrismaService.lead.findMany.mockResolvedValue(expectedLeads);

      const result = await service.findAll();
      expect(result).toEqual(expectedLeads);
      expect(mockPrismaService.lead.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a lead if it exists', async () => {
      const expectedLead = { id: 1, name: 'Lead 1', userId: 1, strategyId: 1 };
      mockPrismaService.lead.findUnique.mockResolvedValue(expectedLead);

      const result = await service.findOne(1);
      expect(result).toEqual(expectedLead);
      expect(mockPrismaService.lead.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { user: true, strategy: true },
      });
    });

    it('should throw NotFoundException if lead does not exist', async () => {
      mockPrismaService.lead.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.lead.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
        include: { user: true, strategy: true },
      });
    });
  });

  describe('create', () => {
    it('should create and return a lead', async () => {
      const createLeadDto = { 
        name: 'New Lead', 
        userId: 1, 
        strategyId: 1,
        email: 'lead@example.com',
        phone: '123-456-7890'
      };
      const createdLead = { id: 3, ...createLeadDto, messageHistory: '[]' };
      mockPrismaService.lead.create.mockResolvedValue(createdLead);

      const result = await service.create(createLeadDto);
      expect(result).toEqual(createdLead);
      expect(mockPrismaService.lead.create).toHaveBeenCalledWith({
        data: {
          ...createLeadDto,
          messageHistory: '[]'
        },
      });
    });
  });

  describe('update', () => {
    it('should update and return a lead if it exists', async () => {
      const updateLeadDto = { name: 'Updated Lead' };
      const updatedLead = { id: 1, name: 'Updated Lead', userId: 1, strategyId: 1 };
      mockPrismaService.lead.update.mockResolvedValue(updatedLead);

      const result = await service.update(1, updateLeadDto);
      expect(result).toEqual(updatedLead);
      expect(mockPrismaService.lead.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateLeadDto,
      });
    });

    it('should throw NotFoundException if lead does not exist', async () => {
      const updateLeadDto = { name: 'Updated Lead' };
      mockPrismaService.lead.update.mockRejectedValue(new Error());

      await expect(service.update(999, updateLeadDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete and return a lead if it exists', async () => {
      const deletedLead = { id: 1, name: 'Lead 1', userId: 1, strategyId: 1 };
      mockPrismaService.lead.delete.mockResolvedValue(deletedLead);

      const result = await service.remove(1);
      expect(result).toEqual(deletedLead);
      expect(mockPrismaService.lead.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException if lead does not exist', async () => {
      mockPrismaService.lead.delete.mockRejectedValue(new Error());

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
