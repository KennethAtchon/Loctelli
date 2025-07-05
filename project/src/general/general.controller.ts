import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
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

  @Get('recent-clients')
  async getRecentClients() {
    return this.generalService.getRecentClients();
  }

  @Get('users/:id/detailed')
  async getDetailedUser(@Param('id', ParseIntPipe) id: number) {
    return this.generalService.getDetailedUser(id);
  }

  @Get('clients/:id/detailed')
  async getDetailedClient(@Param('id', ParseIntPipe) id: number) {
    return this.generalService.getDetailedClient(id);
  }

  @Get('schema')
  async getDatabaseSchema() {
    return this.generalService.getDatabaseSchema();
  }
}
