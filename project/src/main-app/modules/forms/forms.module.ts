import { Module } from '@nestjs/common';
import { FormsService } from './forms.service';
import { FormsController } from './forms.controller';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { StorageModule } from '../../../shared/storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [FormsController],
  providers: [FormsService],
  exports: [FormsService],
})
export class FormsModule {}
