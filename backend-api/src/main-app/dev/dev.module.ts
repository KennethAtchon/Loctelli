import { Module } from '@nestjs/common';
import { DevController } from './dev.controller';
import { DevService } from './dev.service';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';
import { AppCacheModule } from '../infrastructure/cache/cache.module';
import { DevOnlyGuard } from '../../shared/guards/dev-only.guard';

@Module({
  imports: [PrismaModule, AppCacheModule],
  controllers: [DevController],
  providers: [DevService, DevOnlyGuard],
  exports: [DevService],
})
export class DevModule {}
