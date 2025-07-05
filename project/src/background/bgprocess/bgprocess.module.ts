import { Module, forwardRef } from '@nestjs/common';
// import { ScheduleModule } from '@nestjs/schedule'; // DISABLED: Cron jobs temporarily disabled
import { SalesBotService } from './sales-bot.service';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { FreeSlotCronService } from './free-slot-cron.service';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from '../../modules/chat/chat.module';
import { BookingsModule } from '../../modules/bookings/bookings.module';

@Module({
  imports: [
    // ScheduleModule.forRoot(), // DISABLED: Cron jobs temporarily disabled
    PrismaModule,
    ConfigModule,
    forwardRef(() => ChatModule),
    BookingsModule,
  ],
  providers: [SalesBotService, FreeSlotCronService],
  exports: [SalesBotService, FreeSlotCronService],
})
export class BgProcessModule {}
