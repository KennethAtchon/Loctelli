import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('BookingsService', () => {
  let service: BookingsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    booking: {
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of bookings', async () => {
      const expectedBookings = [
        { id: 1, userId: 1, clientId: 1, bookingType: 'call', details: {}, status: 'pending' },
        { id: 2, userId: 1, clientId: 2, bookingType: 'meeting', details: {}, status: 'confirmed' },
      ];
      mockPrismaService.booking.findMany.mockResolvedValue(expectedBookings);

      const result = await service.findAll();
      expect(result).toEqual(expectedBookings);
      expect(mockPrismaService.booking.findMany).toHaveBeenCalledWith({
        include: {
          user: true,
          client: true,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a booking if it exists', async () => {
      const expectedBooking = { id: 1, userId: 1, clientId: 1, bookingType: 'call', details: {}, status: 'pending' };
      mockPrismaService.booking.findUnique.mockResolvedValue(expectedBooking);

      const result = await service.findOne(1);
      expect(result).toEqual(expectedBooking);
      expect(mockPrismaService.booking.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          user: true,
          client: true,
        },
      });
    });

    it('should throw NotFoundException if booking does not exist', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByUserId', () => {
    it('should return bookings for a specific user', async () => {
      const expectedBookings = [
        { id: 1, userId: 1, clientId: 1, bookingType: 'call', details: {}, status: 'pending' },
        { id: 2, userId: 1, clientId: 2, bookingType: 'meeting', details: {}, status: 'confirmed' },
      ];
      mockPrismaService.booking.findMany.mockResolvedValue(expectedBookings);

      const result = await service.findByUserId(1);
      expect(result).toEqual(expectedBookings);
      expect(mockPrismaService.booking.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: {
          client: true,
        },
      });
    });
  });

  describe('findByClientId', () => {
    it('should return bookings for a specific client', async () => {
      const expectedBookings = [
        { id: 1, userId: 1, clientId: 1, bookingType: 'call', details: {}, status: 'pending' },
      ];
      mockPrismaService.booking.findMany.mockResolvedValue(expectedBookings);

      const result = await service.findByClientId(1);
      expect(result).toEqual(expectedBookings);
      expect(mockPrismaService.booking.findMany).toHaveBeenCalledWith({
        where: { clientId: 1 },
        include: {
          user: true,
        },
      });
    });
  });

  describe('create', () => {
    it('should create and return a booking', async () => {
      const createBookingDto = {
        userId: 1,
        clientId: 1,
        bookingType: 'call',
        details: {},
        status: 'pending',
      };
      const createdBooking = { id: 1, ...createBookingDto };
      mockPrismaService.booking.create.mockResolvedValue(createdBooking);

      const result = await service.create(createBookingDto);
      expect(result).toEqual(createdBooking);
      expect(mockPrismaService.booking.create).toHaveBeenCalledWith({
        data: createBookingDto,
      });
    });
  });

  describe('update', () => {
    it('should update and return a booking if it exists', async () => {
      const updateBookingDto = { status: 'confirmed' };
      const updatedBooking = {
        id: 1,
        userId: 1,
        clientId: 1,
        bookingType: 'call',
        details: {},
        status: 'confirmed',
      };
      mockPrismaService.booking.update.mockResolvedValue(updatedBooking);

      const result = await service.update(1, updateBookingDto);
      expect(result).toEqual(updatedBooking);
      expect(mockPrismaService.booking.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateBookingDto,
      });
    });

    it('should throw NotFoundException if booking does not exist', async () => {
      const updateBookingDto = { status: 'confirmed' };
      mockPrismaService.booking.update.mockRejectedValue(new Error());

      await expect(service.update(999, updateBookingDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete and return a booking if it exists', async () => {
      const deletedBooking = {
        id: 1,
        userId: 1,
        clientId: 1,
        bookingType: 'call',
        details: {},
        status: 'pending',
      };
      mockPrismaService.booking.delete.mockResolvedValue(deletedBooking);

      const result = await service.remove(1);
      expect(result).toEqual(deletedBooking);
      expect(mockPrismaService.booking.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException if booking does not exist', async () => {
      mockPrismaService.booking.delete.mockRejectedValue(new Error());

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
