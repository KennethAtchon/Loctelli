import { Module } from '@nestjs/common';
import { SubAccountsService } from './subaccounts.service';
import { SubAccountsController } from './subaccounts.controller';
import { UserSubAccountsController } from './user-subaccounts.controller';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    SubAccountsController,      // Admin endpoints (/admin/subaccounts)
    UserSubAccountsController,  // User endpoints (/subaccounts)
  ],
  providers: [SubAccountsService],
  exports: [SubAccountsService],
})
export class SubAccountsModule {} 