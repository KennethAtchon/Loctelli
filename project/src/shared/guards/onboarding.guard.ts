import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ONBOARDING_SUBACCOUNT_ID } from '../constants/tenant.constants';

export const ALLOW_ONBOARDING_KEY = 'allowOnboarding';

/**
 * Guard to restrict ONBOARDING users from accessing most routes
 *
 * By default, users in the ONBOARDING workspace (subAccountId = 1) are blocked
 * from accessing feature routes. Routes must explicitly use @AllowOnboarding()
 * decorator to allow ONBOARDING users.
 *
 * This ensures new users complete their workspace setup before accessing features.
 */
@Injectable()
export class OnboardingGuard implements CanActivate {
  private readonly logger = new Logger(OnboardingGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route explicitly allows ONBOARDING users
    const allowOnboarding = this.reflector.getAllAndOverride<boolean>(
      ALLOW_ONBOARDING_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const { user } = request;
    const route = `${request.method} ${request.url}`;

    if (!user) {
      return true; // Let auth guard handle this
    }

    // Check if user is in ONBOARDING
    const isOnboarding = user.subAccountId === ONBOARDING_SUBACCOUNT_ID;

    if (isOnboarding && !allowOnboarding) {
      this.logger.warn(
        `🚫 ONBOARDING user blocked: ${user.email} attempted to access ${route}`,
      );
      throw new ForbiddenException(
        'You must join or create a workspace to access this feature. Please complete your onboarding.',
      );
    }

    return true;
  }
}
