import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { IS_DEV_ONLY_KEY } from '../decorators/dev-only.decorator';

@Injectable()
export class DevOnlyGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isDevOnly = this.reflector.getAllAndOverride<boolean>(
      IS_DEV_ONLY_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If not marked as dev-only, allow access
    if (!isDevOnly) {
      return true;
    }

    // Check if DEBUG flag is enabled
    const debug = this.configService.get<string>('DEBUG');
    const isDebugEnabled = debug === 'true' || debug === '1' || debug === 'yes';

    if (!isDebugEnabled) {
      throw new ForbiddenException(
        'This endpoint is only available when DEBUG flag is enabled',
      );
    }

    return true;
  }
}

