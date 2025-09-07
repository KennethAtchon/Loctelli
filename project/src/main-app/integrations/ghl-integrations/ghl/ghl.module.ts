import { Module } from '@nestjs/common';
import { GhlService } from './ghl.service';
import { PrismaModule } from '../../../../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [GhlService],
  exports: [GhlService],
})
export class GhlModule {}
