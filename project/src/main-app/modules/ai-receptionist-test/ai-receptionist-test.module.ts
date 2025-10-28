/**
 * AI Receptionist Test Module
 *
 * Standalone module for testing AI Receptionist SDK
 * NO integration with existing backend modules
 */

import { Module } from '@nestjs/common';
import { AIReceptionistTestController } from './ai-receptionist-test.controller';
import { AIReceptionistTestService } from './ai-receptionist-test.service';

@Module({
  controllers: [AIReceptionistTestController],
  providers: [AIReceptionistTestService],
  exports: [AIReceptionistTestService]
})
export class AIReceptionistTestModule {}
