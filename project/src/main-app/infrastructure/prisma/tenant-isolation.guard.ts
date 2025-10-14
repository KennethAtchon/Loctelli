import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Decorator to mark operations that bypass tenant isolation
 * Use ONLY for admin operations that need cross-tenant access
 *
 * Example:
 * @BypassTenantIsolation()
 * @Get('admin/all-users')
 * getAllUsersAcrossTenants() { ... }
 */
export const BypassTenantIsolation = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('bypassTenantIsolation', true, descriptor.value);
    return descriptor;
  };
};

/**
 * Guard to ensure tenant isolation is maintained
 * Validates that user requests only access their own subAccount data
 */
@Injectable()
export class TenantIsolationGuard implements CanActivate {
  private readonly logger = new Logger(TenantIsolationGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if this endpoint bypasses tenant isolation
    const handler = context.getHandler();
    const bypassIsolation = Reflect.getMetadata('bypassTenantIsolation', handler);

    if (bypassIsolation) {
      this.logger.debug('Bypassing tenant isolation for admin operation');
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Admin users can access any tenant (but should specify subAccountId)
    if (user?.accountType === 'admin') {
      return true;
    }

    // Regular users must have a subAccountId
    if (!user?.subAccountId) {
      this.logger.error(`User ${user?.userId} attempted access without subAccountId`);
      throw new ForbiddenException('Tenant context required');
    }

    // Validate that path params or body don't try to access different subAccountId
    const subAccountIdInParams = request.params?.subAccountId;
    const subAccountIdInBody = request.body?.subAccountId;

    if (subAccountIdInParams && parseInt(subAccountIdInParams) !== user.subAccountId) {
      this.logger.error(
        `User ${user.userId} (subAccount ${user.subAccountId}) ` +
        `attempted to access subAccount ${subAccountIdInParams}`
      );
      throw new ForbiddenException('Access denied: Cannot access other tenant data');
    }

    if (subAccountIdInBody && parseInt(subAccountIdInBody) !== user.subAccountId) {
      this.logger.error(
        `User ${user.userId} (subAccount ${user.subAccountId}) ` +
        `attempted to set subAccountId to ${subAccountIdInBody}`
      );
      throw new ForbiddenException('Access denied: Cannot modify other tenant data');
    }

    return true;
  }
}
