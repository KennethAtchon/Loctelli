import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { GeneralService } from './general.service';
import { JwtAuthGuard } from '../../shared/auth/auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Public } from '../../shared/decorators/public.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

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
  async getDashboardStats(@Query('subaccountId') subaccountId?: string) {
    return this.generalService.getDashboardStats(subaccountId);
  }

  @Get('system-status')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  async getSystemStatus() {
    return this.generalService.getSystemStatus();
  }

  @Get('recent-leads')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  async getRecentLeads(@Query('subaccountId') subaccountId?: string) {
    return this.generalService.getRecentLeads(subaccountId);
  }

  @Get('users/:id/detailed')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  async getDetailedUser(@Param('id', ParseIntPipe) id: number) {
    return this.generalService.getDetailedUser(id);
  }

  @Get('leads/:id/detailed')
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
