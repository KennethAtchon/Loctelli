import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { SharedModule } from '../../../shared/shared.module';
import { SmsController } from './sms.controller';

@Module({
  imports: [
    SharedModule,
    MulterModule.register({
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
      fileFilter: (req, file, callback) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
          callback(null, true);
        } else {
          callback(new Error('Only CSV files are allowed'), false);
        }
      },
    }),
  ],
  controllers: [SmsController],
})
export class SmsModule {}