import { Module } from '@nestjs/common';
import { WebsiteBuilderService } from './website-builder.service';
import { WebsiteBuilderController } from './website-builder.controller';
import { BuildService } from './build.service';
import { SecurityService } from './security.service';
import { CleanupService } from './cleanup.service';

@Module({
  controllers: [WebsiteBuilderController],
  providers: [WebsiteBuilderService, BuildService, SecurityService, CleanupService],
  exports: [WebsiteBuilderService, BuildService, SecurityService, CleanupService],
})
export class WebsiteBuilderSubModule {} 