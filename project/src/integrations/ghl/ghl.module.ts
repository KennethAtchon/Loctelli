import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GhlCalendarService } from './calendar.service';
import { GhlSubaccountService } from './subaccount.service';
import { GhlUserService } from './user.service';

@Module({
  imports: [
    ConfigModule,
  ],
  providers: [GhlCalendarService, GhlSubaccountService, GhlUserService],
  exports: [GhlCalendarService, GhlSubaccountService, GhlUserService],
})
export class GhlModule {}
