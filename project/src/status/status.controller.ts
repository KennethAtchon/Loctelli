import { Controller, Get } from '@nestjs/common';
import { StatusService } from './status.service';

@Controller('status')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Get()
  getSystemStatus() {
    return this.statusService.getSystemStatus();
  }

  @Get('health')
  getHealthCheck() {
    return this.statusService.getHealthCheck();
  }
}
