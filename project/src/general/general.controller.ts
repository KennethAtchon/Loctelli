import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { GeneralService } from './general.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('general')
@UseGuards(JwtAuthGuard)
export class GeneralController {
  constructor(private readonly generalService: GeneralService) {}

  @Get()
  @Public()
  generalGet() {
    return { message: 'General GET endpoint is working!' };
  }

  @Post()
  @Public()
  generalPost(@Body() data: any) {
    return { received: data };
  }

  @Get('dashboard-stats')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  async getDashboardStats() {
    return this.generalService.getDashboardStats();
  }

  @Get('system-status')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  async getSystemStatus() {
    return this.generalService.getSystemStatus();
  }

  @Get('recent-clients')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  async getRecentClients() {
    return this.generalService.getRecentClients();
  }

  @Get('users/:id/detailed')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  async getDetailedUser(@Param('id', ParseIntPipe) id: number) {
    return this.generalService.getDetailedUser(id);
  }

  @Get('clients/:id/detailed')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  async getDetailedLead(@Param('id', ParseIntPipe) id: number) {
    return this.generalService.getDetailedLead(id);
  }

  @Get('schema')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  async getDatabaseSchema() {
    return this.generalService.getDatabaseSchema();
  }
}
