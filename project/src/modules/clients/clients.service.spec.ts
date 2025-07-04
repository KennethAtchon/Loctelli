import { Test, TestingModule } from '@nestjs/testing';
import { ClientsService } from './clients.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ClientsService', () => {
  let service: ClientsService;
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
        ClientsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of clients', async () => {
      const expectedClients = [
        { id: 1, name: 'Client 1', userId: 1, strategyId: 1 },
        { id: 2, name: 'Client 2', userId: 1, strategyId: 2 },
      ];
      mockPrismaService.client.findMany.mockResolvedValue(expectedClients);

      const result = await service.findAll();
      expect(result).toEqual(expectedClients);
      expect(mockPrismaService.client.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a client if it exists', async () => {
      const expectedClient = { id: 1, name: 'Client 1', userId: 1, strategyId: 1 };
      mockPrismaService.client.findUnique.mockResolvedValue(expectedClient);

      const result = await service.findOne(1);
      expect(result).toEqual(expectedClient);
      expect(mockPrismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { user: true, strategy: true },
      });
    });

    it('should throw NotFoundException if client does not exist', async () => {
      mockPrismaService.client.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
        include: { user: true, strategy: true },
      });
    });
  });

  describe('create', () => {
    it('should create and return a client', async () => {
      const createClientDto = { 
        name: 'New Client', 
        userId: 1, 
        strategyId: 1,
        email: 'client@example.com',
        phone: '123-456-7890'
      };
      const createdClient = { id: 3, ...createClientDto, messageHistory: '[]' };
      mockPrismaService.client.create.mockResolvedValue(createdClient);

      const result = await service.create(createClientDto);
      expect(result).toEqual(createdClient);
      expect(mockPrismaService.client.create).toHaveBeenCalledWith({
        data: {
          ...createClientDto,
          messageHistory: '[]'
        },
      });
    });
  });

  describe('update', () => {
    it('should update and return a client if it exists', async () => {
      const updateClientDto = { name: 'Updated Client' };
      const updatedClient = { id: 1, name: 'Updated Client', userId: 1, strategyId: 1 };
      mockPrismaService.client.update.mockResolvedValue(updatedClient);

      const result = await service.update(1, updateClientDto);
      expect(result).toEqual(updatedClient);
      expect(mockPrismaService.client.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateClientDto,
      });
    });

    it('should throw NotFoundException if client does not exist', async () => {
      const updateClientDto = { name: 'Updated Client' };
      mockPrismaService.client.update.mockRejectedValue(new Error());

      await expect(service.update(999, updateClientDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete and return a client if it exists', async () => {
      const deletedClient = { id: 1, name: 'Client 1', userId: 1, strategyId: 1 };
      mockPrismaService.client.delete.mockResolvedValue(deletedClient);

      const result = await service.remove(1);
      expect(result).toEqual(deletedClient);
      expect(mockPrismaService.client.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException if client does not exist', async () => {
      mockPrismaService.client.delete.mockRejectedValue(new Error());

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
