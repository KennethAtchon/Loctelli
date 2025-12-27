import {
  Controller,
  Get,
  Post,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
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
    const startTime = Date.now();
    this.logger.log('📊 [GET /dev/system-info] System info requested');
    try {
      const result = await this.devService.getSystemInfo();
      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ [GET /dev/system-info] System info retrieved successfully in ${duration}ms`,
      );
      this.logger.debug(
        '📋 System info result:',
        JSON.stringify(result, null, 2),
      );
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `❌ [GET /dev/system-info] Failed after ${duration}ms:`,
        error instanceof Error ? error.stack : error,
      );
      throw new HttpException(
        'Failed to get system info',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('cache/clear')
  @Public()
  async clearCache() {
    const startTime = Date.now();
    this.logger.log('🧹 [POST /dev/cache/clear] Cache clear requested');
    try {
      const result = await this.devService.clearCache();
      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ [POST /dev/cache/clear] Cache cleared successfully in ${duration}ms`,
      );
      this.logger.debug(
        '🧹 Cache clear result:',
        JSON.stringify(result, null, 2),
      );
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `❌ [POST /dev/cache/clear] Failed after ${duration}ms:`,
        error instanceof Error ? error.stack : error,
      );
      throw new HttpException(
        'Failed to clear cache',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('database/test')
  @Public()
  async testDatabase() {
    const startTime = Date.now();
    this.logger.log('🔍 [GET /dev/database/test] Database test requested');
    try {
      const result = await this.devService.testDatabase();
      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ [GET /dev/database/test] Database test completed in ${duration}ms - connected: ${result.connected}`,
      );
      this.logger.debug(
        '🔍 Database test result:',
        JSON.stringify(result, null, 2),
      );
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `❌ [GET /dev/database/test] Failed after ${duration}ms:`,
        error instanceof Error ? error.stack : error,
      );
      throw new HttpException(
        'Failed to test database',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('cache/test')
  @Public()
  async testCache() {
    const startTime = Date.now();
    this.logger.log('🔍 [GET /dev/cache/test] Cache test requested');
    try {
      const result = await this.devService.testCache();
      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ [GET /dev/cache/test] Cache test completed in ${duration}ms - connected: ${result.connected}`,
      );
      this.logger.debug(
        '🔍 Cache test result:',
        JSON.stringify(result, null, 2),
      );
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `❌ [GET /dev/cache/test] Failed after ${duration}ms:`,
        error instanceof Error ? error.stack : error,
      );
      throw new HttpException(
        'Failed to test cache',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
