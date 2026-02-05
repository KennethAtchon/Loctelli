import { test, expect, describe, beforeEach, afterEach, mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

describe('BookingsController', () => {
  let controller: BookingsController;
  let bookingsService: BookingsService;

  const mockBookingsService = {
    create: mock(),
    findAll: mock(),
    findAllBySubAccount: mock(),
    findAllByAdmin: mock(),
    findOne: mock(),
    findByUserId: mock(),
    findByleadId: mock(),
    update: mock(),
    remove: mock(),
  };

  const mockAdminUser = {
    userId: 999,
    role: 'admin',
    type: 'admin',
    subAccountId: 1,
  };

  const mockUser = {
    userId: 1,
    role: 'user',
    type: 'user',
    subAccountId: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        {
          provide: BookingsService,
          useValue: mockBookingsService,
        },
      ],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
    bookingsService = module.get<BookingsService>(BookingsService);
  });

  afterEach(() => {
    // Bun mocks cleared automatically;
  });

  test('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createBookingDto: CreateBookingDto = {
      regularUserId: 1,
      leadId: 1,
      bookingType: 'call',
      details: {},
      status: 'pending',
      subAccountId: 1,
    };

    const mockCreatedBooking = {
      id: 1,
      ...createBookingDto,
    } as any;

    test('should create a booking for admin user', async () => {
      mockBookingsService.create.mockResolvedValue(mockCreatedBooking);

      const result = await controller.create(createBookingDto, mockAdminUser);

      expect(result).toEqual(mockCreatedBooking);
      expect(mockBookingsService.create).toHaveBeenCalledWith(
        createBookingDto,
        createBookingDto.subAccountId,
      );
    });

    test('should create a booking for regular user', async () => {
      mockBookingsService.create.mockResolvedValue(mockCreatedBooking);

      const result = await controller.create(createBookingDto, mockUser);

      expect(result).toEqual(mockCreatedBooking);
      expect(mockBookingsService.create).toHaveBeenCalledWith(
        createBookingDto,
        mockUser.subAccountId,
      );
    });
  });

  describe('findAll', () => {
    const mockBookings = [
      { id: 1, userId: 1, leadId: 1, bookingType: 'call', status: 'pending' },
      {
        id: 2,
        userId: 2,
        leadId: 2,
        bookingType: 'meeting',
        status: 'confirmed',
      },
    ] as any[];

    test('should return all bookings for admin when no query parameters', async () => {
      mockBookingsService.findAllByAdmin.mockResolvedValue(mockBookings);

      const result = await controller.findAll(mockAdminUser);

      expect(result).toEqual(mockBookings);
      expect(mockBookingsService.findAllByAdmin).toHaveBeenCalledWith(
        mockAdminUser.userId,
      );
    });

    test('should return bookings by subAccount for regular user when no query parameters', async () => {
      mockBookingsService.findAllBySubAccount.mockResolvedValue(mockBookings);

      const result = await controller.findAll(mockUser);

      expect(result).toEqual(mockBookings);
      expect(mockBookingsService.findAllBySubAccount).toHaveBeenCalledWith(
        mockUser.subAccountId,
      );
    });

    test('should return bookings by userId when userId query parameter is provided', async () => {
      const userBookings = [
        { id: 1, userId: 1, leadId: 1, bookingType: 'call', status: 'pending' },
      ] as any[];
      mockBookingsService.findByUserId.mockResolvedValue(userBookings);

      const result = await controller.findAll(mockAdminUser, '1');

      expect(result).toEqual(userBookings as any);
      expect(mockBookingsService.findByUserId).toHaveBeenCalledWith(1);
    });

    test('should return bookings by leadId when leadId query parameter is provided', async () => {
      const leadBookings = [
        { id: 1, userId: 1, leadId: 1, bookingType: 'call', status: 'pending' },
      ] as any[];
      mockBookingsService.findByleadId.mockResolvedValue(leadBookings);

      const result = await controller.findAll(mockAdminUser, undefined, '1');

      expect(result).toEqual(leadBookings as any);
      expect(mockBookingsService.findByleadId).toHaveBeenCalledWith(
        1,
        mockAdminUser.userId,
        mockAdminUser.role,
      );
    });

    test('should throw HttpException for invalid userId parameter', () => {
      expect(() => controller.findAll(mockAdminUser, 'invalid')).toThrow(
        new HttpException('Invalid userId parameter', HttpStatus.BAD_REQUEST),
      );
    });

    test('should throw HttpException for invalid leadId parameter', () => {
      expect(() =>
        controller.findAll(mockAdminUser, undefined, 'invalid'),
      ).toThrow(
        new HttpException('Invalid leadId parameter', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('findOne', () => {
    const mockBooking = {
      id: 1,
      userId: 1,
      leadId: 1,
      bookingType: 'call',
      status: 'pending',
    } as any;

    test('should return a booking by id', async () => {
      mockBookingsService.findOne.mockResolvedValue(mockBooking);

      const result = await controller.findOne(1, mockAdminUser);

      expect(result).toEqual(mockBooking);
      expect(mockBookingsService.findOne).toHaveBeenCalledWith(
        1,
        mockAdminUser.userId,
        mockAdminUser.role,
      );
    });
  });

  describe('update', () => {
    const updateBookingDto: UpdateBookingDto = {
      status: 'confirmed',
    };

    const mockUpdatedBooking = {
      id: 1,
      userId: 1,
      leadId: 1,
      bookingType: 'call',
      status: 'confirmed',
    } as any;

    test('should update a booking', async () => {
      mockBookingsService.update.mockResolvedValue(mockUpdatedBooking);

      const result = await controller.update(
        1,
        updateBookingDto,
        mockAdminUser,
      );

      expect(result).toEqual(mockUpdatedBooking);
      expect(mockBookingsService.update).toHaveBeenCalledWith(
        1,
        updateBookingDto,
        mockAdminUser.userId,
        mockAdminUser.role,
      );
    });
  });

  describe('updateStatus', () => {
    const statusBody = { status: 'confirmed' };

    const mockUpdatedBooking = {
      id: 1,
      userId: 1,
      leadId: 1,
      bookingType: 'call',
      status: 'confirmed',
    } as any;

    test('should update booking status', async () => {
      mockBookingsService.update.mockResolvedValue(mockUpdatedBooking);

      const result = await controller.updateStatus(
        1,
        statusBody,
        mockAdminUser,
      );

      expect(result).toEqual(mockUpdatedBooking);
      expect(mockBookingsService.update).toHaveBeenCalledWith(
        1,
        { status: 'confirmed' },
        mockAdminUser.userId,
        mockAdminUser.role,
      );
    });
  });

  describe('remove', () => {
    const mockDeletedBooking = {
      id: 1,
      userId: 1,
      leadId: 1,
      bookingType: 'call',
      status: 'pending',
    } as any;

    test('should delete a booking', async () => {
      mockBookingsService.remove.mockResolvedValue(mockDeletedBooking);

      const result = await controller.remove(1, mockAdminUser);

      expect(result).toEqual(mockDeletedBooking);
      expect(mockBookingsService.remove).toHaveBeenCalledWith(
        1,
        mockAdminUser.userId,
        mockAdminUser.role,
      );
    });
  });
});
