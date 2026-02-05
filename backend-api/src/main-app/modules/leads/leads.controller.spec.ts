/* eslint-disable @typescript-eslint/await-thenable */
import { test, expect, describe, beforeEach, afterEach, mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

describe('LeadsController', () => {
  let controller: LeadsController;
  let leadsService: LeadsService;

  const mockLeadsService = {
    create: mock(),
    findAll: mock(),
    findAllBySubAccount: mock(),
    findAllByAdmin: mock(),
    findOne: mock(),
    findByUserId: mock(),
    findByStrategyId: mock(),
    update: mock(),
    appendMessage: mock(),
    remove: mock(),
  };

  const mockAdminUser = {
    userId: 999,
    email: 'admin@example.com',
    role: 'admin',
    type: 'admin',
    subAccountId: 1,
  };

  const mockUser = {
    userId: 1,
    email: 'user@example.com',
    role: 'user',
    type: 'user',
    subAccountId: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeadsController],
      providers: [
        {
          provide: LeadsService,
          useValue: mockLeadsService,
        },
      ],
    }).compile();

    controller = module.get<LeadsController>(LeadsController);
    leadsService = module.get<LeadsService>(LeadsService);
  });

  afterEach(() => {
    // Bun mocks cleared automatically;
  });

  test('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createLeadDto: CreateLeadDto = {
      name: 'New Lead',
      regularUserId: 1,
      strategyId: 1,
      email: 'lead@example.com',
      phone: '123-456-7890',
      subAccountId: 1,
    };

    const mockCreatedLead = {
      id: 1,
      ...createLeadDto,
    } as any;

    test('should create a lead for admin user', async () => {
      mockLeadsService.create.mockResolvedValue(mockCreatedLead);

      const result = await controller.create(createLeadDto, mockAdminUser);

      expect(result).toEqual(mockCreatedLead);
      expect(mockLeadsService.create).toHaveBeenCalledWith(
        createLeadDto,
        createLeadDto.subAccountId,
      );
    });

    test('should create a lead for regular user', async () => {
      mockLeadsService.create.mockResolvedValue(mockCreatedLead);

      const result = await controller.create(createLeadDto, mockUser);

      expect(result).toEqual(mockCreatedLead);
      expect(mockLeadsService.create).toHaveBeenCalledWith(
        createLeadDto,
        mockUser.subAccountId,
      );
    });
  });

  describe('findAll', () => {
    const mockLeads = [
      { id: 1, name: 'Lead 1', userId: 1 },
      { id: 2, name: 'Lead 2', userId: 2 },
    ] as any[];

    test('should return all leads for admin when no query parameters', async () => {
      mockLeadsService.findAllByAdmin.mockResolvedValue(mockLeads);

      const result = await controller.findAll(mockAdminUser);

      expect(result).toEqual(mockLeads as any);
      expect(mockLeadsService.findAllByAdmin).toHaveBeenCalledWith(
        mockAdminUser.userId,
      );
    });

    test('should return leads by subAccount for regular user when no query parameters', async () => {
      mockLeadsService.findAllBySubAccount.mockResolvedValue(mockLeads);

      const result = await controller.findAll(mockUser);

      expect(result).toEqual(mockLeads);
      expect(mockLeadsService.findAllBySubAccount).toHaveBeenCalledWith(
        mockUser.subAccountId,
      );
    });

    test('should return leads by userId when userId query parameter is provided', async () => {
      const userLeads = [{ id: 1, name: 'Lead 1', userId: 1 }];
      mockLeadsService.findByUserId.mockResolvedValue(userLeads);

      const result = await controller.findAll(mockAdminUser, '1');

      expect(result).toEqual(userLeads);
      expect(mockLeadsService.findByUserId).toHaveBeenCalledWith(1);
    });

    test('should return leads by strategyId when strategyId query parameter is provided', async () => {
      const strategyLeads = [{ id: 1, name: 'Lead 1', strategyId: 1 }] as any[];
      mockLeadsService.findByStrategyId.mockResolvedValue(strategyLeads);

      const result = await controller.findAll(mockAdminUser, undefined, '1');

      expect(result).toEqual(strategyLeads as any);
      expect(mockLeadsService.findByStrategyId).toHaveBeenCalledWith(
        1,
        mockAdminUser.userId,
        mockAdminUser.role,
      );
    });

    test('should return leads by subAccountId for admin when subAccountId query parameter is provided', async () => {
      mockLeadsService.findAllBySubAccount.mockResolvedValue(mockLeads);

      const result = await controller.findAll(
        mockAdminUser,
        undefined,
        undefined,
        '1',
      );

      expect(result).toEqual(mockLeads);
      expect(mockLeadsService.findAllBySubAccount).toHaveBeenCalledWith(1);
    });

    test('should throw HttpException for invalid userId parameter', async () => {
      await expect(
        controller.findAll(mockAdminUser, 'invalid'),
      ).rejects.toThrow(
        new HttpException('Invalid userId parameter', HttpStatus.BAD_REQUEST),
      );
    });

    test('should throw HttpException for invalid strategyId parameter', async () => {
      await expect(
        controller.findAll(mockAdminUser, undefined, 'invalid'),
      ).rejects.toThrow(
        new HttpException(
          'Invalid strategyId parameter',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });

  describe('findOne', () => {
    const mockLead = {
      id: 1,
      name: 'Lead 1',
      userId: 1,
      strategyId: 1,
    } as any;

    test('should return a lead by id', async () => {
      mockLeadsService.findOne.mockResolvedValue(mockLead);

      const result = await controller.findOne(1, mockAdminUser);

      expect(result).toEqual(mockLead);
      expect(mockLeadsService.findOne).toHaveBeenCalledWith(
        1,
        mockAdminUser.userId,
        mockAdminUser.role,
      );
    });
  });

  describe('update', () => {
    const updateLeadDto: UpdateLeadDto = {
      name: 'Updated Lead',
    };

    const mockUpdatedLead = {
      id: 1,
      name: 'Updated Lead',
      userId: 1,
      strategyId: 1,
    } as any;

    test('should update a lead', async () => {
      mockLeadsService.update.mockResolvedValue(mockUpdatedLead);

      const result = await controller.update(1, updateLeadDto, mockAdminUser);

      expect(result).toEqual(mockUpdatedLead);
      expect(mockLeadsService.update).toHaveBeenCalledWith(
        1,
        updateLeadDto,
        mockAdminUser.userId,
        mockAdminUser.role,
      );
    });
  });

  describe('appendMessage', () => {
    const mockMessage = {
      role: 'user',
      content: 'Hello, I need help',
      timestamp: '2023-01-01T00:00:00Z',
    };

    const mockUpdatedLead = {
      id: 1,
      name: 'Lead 1',
      messageHistory: JSON.stringify([mockMessage]),
    } as any;

    test('should append a message to a lead', async () => {
      mockLeadsService.appendMessage.mockResolvedValue(mockUpdatedLead);

      const result = await controller.appendMessage(1, mockMessage);

      expect(result).toEqual(mockUpdatedLead);
      expect(mockLeadsService.appendMessage).toHaveBeenCalledWith(
        1,
        mockMessage,
      );
    });
  });

  describe('remove', () => {
    const mockDeletedLead = {
      id: 1,
      name: 'Lead 1',
      userId: 1,
    } as any;

    test('should delete a lead', async () => {
      mockLeadsService.remove.mockResolvedValue(mockDeletedLead);

      const result = await controller.remove(1, mockAdminUser);

      expect(result).toEqual(mockDeletedLead);
      expect(mockLeadsService.remove).toHaveBeenCalledWith(
        1,
        mockAdminUser.userId,
        mockAdminUser.role,
      );
    });
  });
});
