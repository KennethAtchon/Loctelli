import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Controller('booking')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(createBookingDto);
  }

  @Get()
  findAll(
    @Query('userId') userId?: string,
    @Query('clientId') clientId?: string,
  ) {
    if (userId) {
      const parsedUserId = parseInt(userId, 10);
      if (isNaN(parsedUserId)) {
        throw new Error('Invalid userId parameter');
      }
      return this.bookingsService.findByUserId(parsedUserId);
    }
    if (clientId) {
      const parsedClientId = parseInt(clientId, 10);
      if (isNaN(parsedClientId)) {
        throw new Error('Invalid clientId parameter');
      }
      return this.bookingsService.findByClientId(parsedClientId);
    }
    return this.bookingsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBookingDto: UpdateBookingDto,
  ) {
    return this.bookingsService.update(id, updateBookingDto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: string },
  ) {
    return this.bookingsService.update(id, { status: body.status });
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.remove(id);
  }
}
