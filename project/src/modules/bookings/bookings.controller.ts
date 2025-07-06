import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Admin } from '../../auth/decorators/admin.decorator';
import { AdminGuard } from '../../auth/guards/admin.guard';

@Controller('booking')
@UseGuards(AdminGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Admin()
  create(@Body() createBookingDto: CreateBookingDto) {
    // Admin users can create bookings for any regular user
    // The userId should be provided in the DTO by the frontend
    return this.bookingsService.create(createBookingDto);
  }

  @Get()
  @Admin()
  findAll(@CurrentUser() user, @Query('userId') userId?: string, @Query('clientId') clientId?: string) {
    if (userId) {
      const parsedUserId = parseInt(userId, 10);
      if (isNaN(parsedUserId)) {
        throw new HttpException('Invalid userId parameter', HttpStatus.BAD_REQUEST);
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
    
    // Admin users can see all bookings
    return this.bookingsService.findAll();
  }

  @Get(':id')
  @Admin()
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user) {
    return this.bookingsService.findOne(id, user.userId, user.role);
  }

  @Patch(':id')
  @Admin()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBookingDto: UpdateBookingDto,
    @CurrentUser() user
  ) {
    return this.bookingsService.update(id, updateBookingDto, user.userId, user.role);
  }

  @Patch(':id/status')
  @Admin()
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: string },
    @CurrentUser() user
  ) {
    return this.bookingsService.update(id, { status: body.status }, user.userId, user.role);
  }

  @Delete(':id')
  @Admin()
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user) {
    return this.bookingsService.remove(id, user.userId, user.role);
  }
}
