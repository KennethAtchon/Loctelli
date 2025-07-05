import { Controller, Get, Post, Body } from '@nestjs/common';
import { GeneralService } from './general.service';

@Controller('general')
export class GeneralController {
  constructor(private readonly generalService: GeneralService) {}

  @Get()
  generalGet() {
    return { message: 'General GET endpoint is working!' };
  }

  @Post()
  generalPost(@Body() data: any) {
    return { received: data };
  }

  @Get('dashboard-stats')
  async getDashboardStats() {
    return this.generalService.getDashboardStats();
  }

  @Get('system-status')
  async getSystemStatus() {
    return this.generalService.getSystemStatus();
  }
}
