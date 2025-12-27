import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { IS_DEV_ONLY_KEY } from '../decorators/dev-only.decorator';

@Injectable()
export class DevOnlyGuard implements CanActivate {
  private readonly logger = new Logger(DevOnlyGuard.name);

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const controller = context.getClass();
    const method = request.method;
    const url = request.url;
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';

    this.logger.debug(
      `🔒 DevOnlyGuard: Checking access for ${method} ${url} from ${ip}`,
    );

    const isDevOnly = this.reflector.getAllAndOverride<boolean>(
      IS_DEV_ONLY_KEY,
      [handler, controller],
    );

    // If not marked as dev-only, allow access
    if (!isDevOnly) {
      this.logger.debug(
        `✅ DevOnlyGuard: Endpoint ${method} ${url} is not marked as dev-only, allowing access`,
      );
      return true;
    }

    this.logger.log(
      `🛡️ DevOnlyGuard: Dev-only endpoint accessed: ${method} ${url} from ${ip}`,
    );

    // Check if DEBUG flag is enabled
    const debug = this.configService.get<string>('DEBUG');
    // Normalize the value: trim whitespace, convert to lowercase
    const normalizedDebug = debug?.toString().trim().toLowerCase() || '';
    const isDebugEnabled =
      normalizedDebug === 'true' ||
      normalizedDebug === '1' ||
      normalizedDebug === 'yes' ||
      normalizedDebug === 'on' ||
      normalizedDebug === 'enabled';

    // Log for debugging purposes
    this.logger.log(
      `🔍 DevOnlyGuard: DEBUG flag check - raw="${debug}", normalized="${normalizedDebug}", enabled=${isDebugEnabled}`,
    );

    if (!isDebugEnabled) {
      this.logger.warn(
        `🚫 DevOnlyGuard: Access denied to ${method} ${url} - DEBUG flag not enabled (value: "${debug}")`,
      );
      throw new ForbiddenException(
        `This endpoint is only available when DEBUG flag is enabled. Current DEBUG value: "${debug}"`,
      );
    }

    this.logger.log(
      `✅ DevOnlyGuard: Access granted to ${method} ${url} - DEBUG flag is enabled`,
    );
    return true;
  }
}
