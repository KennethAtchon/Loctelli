import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { BookingHelperService } from './booking-helper.service';
import { GhlModule } from '../../integrations/ghl-integrations/ghl/ghl.module';
import { ConfigModule } from '@nestjs/config';
import { FreeSlotCronService } from '../../background/bgprocess/free-slot-cron.service';

@Module({
  imports: [PrismaModule, GhlModule, ConfigModule],
  controllers: [BookingsController],
  providers: [BookingsService, BookingHelperService, FreeSlotCronService],
  exports: [BookingsService, BookingHelperService],
})
export class BookingsModule {}
