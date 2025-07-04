import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SalesBotService } from './sales-bot.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FreeSlotCronService } from './free-slot-cron.service';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from '../chat/chat.module';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    ConfigModule,
    ChatModule,
    BookingsModule,
  ],
  providers: [SalesBotService, FreeSlotCronService],
  exports: [SalesBotService, FreeSlotCronService],
})
export class BgProcessModule {}
