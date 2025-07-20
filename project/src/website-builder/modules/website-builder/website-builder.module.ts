import { Module } from '@nestjs/common';
import { WebsiteBuilderService } from './website-builder.service';
import { WebsiteBuilderController } from './website-builder.controller';

@Module({
  controllers: [WebsiteBuilderController],
  providers: [WebsiteBuilderService],
  exports: [WebsiteBuilderService],
})
export class WebsiteBuilderSubModule {} 