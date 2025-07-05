import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, HttpException, HttpStatus } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('booking')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Body() createBookingDto: CreateBookingDto, @CurrentUser() user) {
    // Ensure the booking is created for the current user
    return this.bookingsService.create({ ...createBookingDto, userId: user.userId });
  }

  @Get()
  findAll(@CurrentUser() user, @Query('userId') userId?: string, @Query('clientId') clientId?: string) {
    if (userId) {
      const parsedUserId = parseInt(userId, 10);
      if (isNaN(parsedUserId)) {
        throw new HttpException('Invalid userId parameter', HttpStatus.BAD_REQUEST);
      }
      // Only allow viewing other users' bookings if admin
      if (user.role !== 'admin' && user.role !== 'super_admin' && user.userId !== parsedUserId) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }
      return this.bookingsService.findByUserId(parsedUserId);
    }
    
    if (clientId) {
      const parsedClientId = parseInt(clientId, 10);
      if (isNaN(parsedClientId)) {
        throw new HttpException('Invalid clientId parameter', HttpStatus.BAD_REQUEST);
      }
      return this.bookingsService.findByClientId(parsedClientId, user.userId, user.role);
    }
    
    // Return current user's bookings
    return this.bookingsService.findByUserId(user.userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user) {
    return this.bookingsService.findOne(id, user.userId, user.role);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBookingDto: UpdateBookingDto,
    @CurrentUser() user
  ) {
    return this.bookingsService.update(id, updateBookingDto, user.userId, user.role);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: string },
    @CurrentUser() user
  ) {
    return this.bookingsService.update(id, { status: body.status }, user.userId, user.role);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user) {
    return this.bookingsService.remove(id, user.userId, user.role);
  }
}
