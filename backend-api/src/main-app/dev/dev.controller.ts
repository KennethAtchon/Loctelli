import { Controller, Get, Post, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { DevService } from './dev.service';
import { DevOnly } from '../../shared/decorators/dev-only.decorator';
import { UseGuards } from '@nestjs/common';
import { DevOnlyGuard } from '../../shared/guards/dev-only.guard';
import { Public } from '../../shared/decorators/public.decorator';

/**
 * Dev controller for infrastructure operations
 * Only available in development mode
 */
@Controller('dev')
@UseGuards(DevOnlyGuard)
@DevOnly()
export class DevController {
  private readonly logger = new Logger(DevController.name);

  constructor(private readonly devService: DevService) {}

  @Get('system-info')
  @Public()
  async getSystemInfo() {
    this.logger.log('📊 System info requested');
    try {
      return await this.devService.getSystemInfo();
    } catch (error) {
      this.logger.error('❌ Failed to get system info:', error);
      throw new HttpException(
        'Failed to get system info',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('cache/clear')
  @Public()
  async clearCache() {
    this.logger.log('🧹 Cache clear requested');
    try {
      return await this.devService.clearCache();
    } catch (error) {
      this.logger.error('❌ Failed to clear cache:', error);
      throw new HttpException(
        'Failed to clear cache',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('database/test')
  @Public()
  async testDatabase() {
    this.logger.log('🔍 Database test requested');
    try {
      return await this.devService.testDatabase();
    } catch (error) {
      this.logger.error('❌ Failed to test database:', error);
      throw new HttpException(
        'Failed to test database',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('cache/test')
  @Public()
  async testCache() {
    this.logger.log('🔍 Cache test requested');
    try {
      return await this.devService.testCache();
    } catch (error) {
      this.logger.error('❌ Failed to test cache:', error);
      throw new HttpException(
        'Failed to test cache',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

