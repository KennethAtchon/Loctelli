/* eslint-disable @typescript-eslint/await-thenable */
import { test, expect, describe, beforeEach, afterEach, mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

describe('BookingsService', () => {
  let service: BookingsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    booking: {
      findMany: mock(),
      findUnique: mock(),
      create: mock(),
      update: mock(),
      delete: mock(),
    },
    lead: {
      findUnique: mock(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    // Bun mocks cleared automatically;
  });

  test('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createBookingDto: CreateBookingDto = {
      regularUserId: 1,
      leadId: 1,
      bookingType: 'call',
      details: {},
      status: 'pending',
    };

    const mockCreatedBooking = {
      id: 1,
      ...createBookingDto,
    } as any;

    test('should create and return a booking', async () => {
      mockPrismaService.booking.create.mockResolvedValue(mockCreatedBooking);

      const result = await service.create(createBookingDto, 1);
      expect(result).toEqual(mockCreatedBooking);
      expect(mockPrismaService.booking.create).toHaveBeenCalledWith({
        data: {
          ...createBookingDto,
          subAccountId: 1,
        },
      });
    });
  });

  describe('findAll', () => {
    const mockBookings = [
      {
        id: 1,
        userId: 1,
        leadId: 1,
        bookingType: 'call',
        details: {},
        status: 'pending',
      },
      {
        id: 2,
        userId: 1,
        leadId: 2,
        bookingType: 'meeting',
        details: {},
        status: 'confirmed',
      },
    ] as any[];

    test('should return an array of bookings', async () => {
      mockPrismaService.booking.findMany.mockResolvedValue(mockBookings);

      const result = await service.findAll();
      expect(result).toEqual(mockBookings as any);
      expect(mockPrismaService.booking.findMany).toHaveBeenCalledWith({
        include: {
          user: true,
          lead: true,
        },
      });
    });
  });

  describe('findOne', () => {
    const mockBooking = {
      id: 1,
      userId: 1,
      leadId: 1,
      bookingType: 'call',
      details: {},
      status: 'pending',
      user: { id: 1, name: 'User 1' },
      lead: { id: 1, name: 'Lead 1' },
    } as any;

    test('should return a booking if it exists and user has permission', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);

      const result = await service.findOne(1, 1, 'user');
      expect(result).toEqual(mockBooking);
      expect(mockPrismaService.booking.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          user: true,
          lead: true,
        },
      });
    });

    test('should return a booking if user is admin', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);

      const result = await service.findOne(1, 999, 'admin');
      expect(result).toEqual(mockBooking);
    });

    test('should throw NotFoundException if booking does not exist', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(
        async () => await service.findOne(999, 1, 'user'),
      ).rejects.toThrow(NotFoundException);
    });

    test('should throw ForbiddenException if user does not have permission', async () => {
      const bookingWithDifferentUser = { ...mockBooking, userId: 2 };
      mockPrismaService.booking.findUnique.mockResolvedValue(
        bookingWithDifferentUser,
      );

      await expect(
        async () => await service.findOne(1, 1, 'user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findByUserId', () => {
    const mockBookings = [
      {
        id: 1,
        userId: 1,
        leadId: 1,
        bookingType: 'call',
        details: {},
        status: 'pending',
      },
      {
        id: 2,
        userId: 1,
        leadId: 2,
        bookingType: 'meeting',
        details: {},
        status: 'confirmed',
      },
    ] as any[];

    test('should return bookings for a specific user', async () => {
      mockPrismaService.booking.findMany.mockResolvedValue(mockBookings);

      const result = await service.findByUserId(1);
      expect(result).toEqual(mockBookings as any);
      expect(mockPrismaService.booking.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: {
          lead: true,
        },
      });
    });
  });

  describe('findByleadId', () => {
    const mockLead = { id: 1, name: 'Lead 1', userId: 1 } as any;
    const mockBookings = [
      {
        id: 1,
        userId: 1,
        leadId: 1,
        bookingType: 'call',
        details: {},
        status: 'pending',
      },
    ] as any[];

    test('should return bookings for a lead if user has permission', async () => {
      mockPrismaService.lead.findUnique.mockResolvedValue(mockLead);
      mockPrismaService.booking.findMany.mockResolvedValue(mockBookings);

      const result = await service.findByleadId(1, 1, 'user');
      expect(result).toEqual(mockBookings as any);
      expect(mockPrismaService.lead.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrismaService.booking.findMany).toHaveBeenCalledWith({
        where: { leadId: 1 },
        include: {
          lead: true,
        },
      });
    });

    test('should return bookings for a lead if user is admin', async () => {
      mockPrismaService.lead.findUnique.mockResolvedValue(mockLead);
      mockPrismaService.booking.findMany.mockResolvedValue(mockBookings);

      const result = await service.findByleadId(1, 999, 'admin');
      expect(result).toEqual(mockBookings as any);
    });

    test('should throw NotFoundException if lead does not exist', async () => {
      mockPrismaService.lead.findUnique.mockResolvedValue(null);

      await expect(
        async () => await service.findByleadId(999, 1, 'user'),
      ).rejects.toThrow(NotFoundException);
    });

    test('should throw ForbiddenException if user does not have permission', async () => {
      const leadWithDifferentUser = { ...mockLead, userId: 2 };
      mockPrismaService.lead.findUnique.mockResolvedValue(
        leadWithDifferentUser,
      );

      await expect(
        async () => await service.findByleadId(1, 1, 'user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    const updateBookingDto: UpdateBookingDto = { status: 'confirmed' };
    const mockBooking = {
      id: 1,
      userId: 1,
      leadId: 1,
      bookingType: 'call',
      details: {},
      status: 'pending',
    } as any;
    const mockUpdatedBooking = {
      id: 1,
      userId: 1,
      leadId: 1,
      bookingType: 'call',
      details: {},
      status: 'confirmed',
      user: { id: 1, name: 'User 1' },
      lead: { id: 1, name: 'Lead 1' },
    } as any;

    test('should update and return a booking if user has permission', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.booking.update.mockResolvedValue(mockUpdatedBooking);

      const result = await service.update(1, updateBookingDto, 1, 'user');
      expect(result).toEqual(mockUpdatedBooking);
      expect(mockPrismaService.booking.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrismaService.booking.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateBookingDto,
        include: {
          user: true,
          lead: true,
        },
      });
    });

    test('should update and return a booking if user is admin', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.booking.update.mockResolvedValue(mockUpdatedBooking);

      const result = await service.update(1, updateBookingDto, 999, 'admin');
      expect(result).toEqual(mockUpdatedBooking);
    });

    test('should throw NotFoundException if booking does not exist', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(
        async () => await service.update(999, updateBookingDto, 1, 'user'),
      ).rejects.toThrow(NotFoundException);
    });

    test('should throw ForbiddenException if user does not have permission', async () => {
      const bookingWithDifferentUser = { ...mockBooking, userId: 2 };
      mockPrismaService.booking.findUnique.mockResolvedValue(
        bookingWithDifferentUser,
      );

      await expect(
        async () => await service.update(1, updateBookingDto, 1, 'user'),
      ).rejects.toThrow(ForbiddenException);
    });

    test('should throw NotFoundException if update fails', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.booking.update.mockRejectedValue(
        new Error('Update failed'),
      );

      await expect(
        async () => await service.update(1, updateBookingDto, 1, 'user'),
      ).rejects.toThrow(NotFoundException);
    });

    test('should throw NotFoundException for foreign key constraint error', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      const foreignKeyError = new Error('Foreign key constraint failed');
      (foreignKeyError as any).code = 'P2003';
      mockPrismaService.booking.update.mockRejectedValue(foreignKeyError);

      await expect(
        async () => await service.update(1, updateBookingDto, 1, 'user'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    const mockBooking = {
      id: 1,
      userId: 1,
      leadId: 1,
      bookingType: 'call',
      details: {},
      status: 'pending',
    } as any;
    const mockDeletedBooking = {
      id: 1,
      userId: 1,
      leadId: 1,
      bookingType: 'call',
      details: {},
      status: 'pending',
    } as any;

    test('should delete and return a booking if user has permission', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.booking.delete.mockResolvedValue(mockDeletedBooking);

      const result = await service.remove(1, 1, 'user');
      expect(result).toEqual(mockDeletedBooking);
      expect(mockPrismaService.booking.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrismaService.booking.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    test('should delete and return a booking if user is admin', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.booking.delete.mockResolvedValue(mockDeletedBooking);

      const result = await service.remove(1, 999, 'admin');
      expect(result).toEqual(mockDeletedBooking);
    });

    test('should throw NotFoundException if booking does not exist', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(
        async () => await service.remove(999, 1, 'user'),
      ).rejects.toThrow(NotFoundException);
    });

    test('should throw ForbiddenException if user does not have permission', async () => {
      const bookingWithDifferentUser = { ...mockBooking, userId: 2 };
      mockPrismaService.booking.findUnique.mockResolvedValue(
        bookingWithDifferentUser,
      );

      await expect(
        async () => await service.remove(1, 1, 'user'),
      ).rejects.toThrow(ForbiddenException);
    });

    test('should throw NotFoundException if delete fails', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.booking.delete.mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(
        async () => await service.remove(1, 1, 'user'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
