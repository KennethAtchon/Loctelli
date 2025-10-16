import { SetMetadata } from '@nestjs/common';
import { ALLOW_ONBOARDING_KEY } from '../guards/onboarding.guard';

/**
 * Decorator to allow ONBOARDING users to access a route
 *
 * By default, ONBOARDING users are blocked from most routes.
 * Use this decorator on routes that ONBOARDING users should be able to access,
 * such as:
 * - Profile/settings pages
 * - Workspace creation endpoints
 * - Invitation validation endpoints
 *
 * @example
 * ```typescript
 * @Get('profile')
 * @AllowOnboarding()
 * async getProfile(@Req() req: any) {
 *   return this.userService.getProfile(req.user.userId);
 * }
 * ```
 */
export const AllowOnboarding = () => SetMetadata(ALLOW_ONBOARDING_KEY, true);
