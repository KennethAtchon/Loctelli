import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SubAccountsService } from './subaccounts.service';
import { CreateSubAccountDto } from './dto/create-subaccount.dto';
import { JoinSubAccountDto } from './dto/join-subaccount.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { JwtAuthGuard } from '../../../shared/auth/auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { AllowOnboarding } from '../../../shared/decorators/allow-onboarding.decorator';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';

/**
 * User-facing SubAccount endpoints for ONBOARDING flow
 * These endpoints are accessible to regular users (not just admins)
 */
@Controller('subaccounts')
@UseGuards(JwtAuthGuard)
export class UserSubAccountsController {
  constructor(private readonly subAccountsService: SubAccountsService) {}

  /**
   * Create new subaccount (for ONBOARDING users)
   * Moves user from ONBOARDING workspace to their new workspace
   */
  @Post('create')
  @AllowOnboarding() // Explicitly allow ONBOARDING users
  createForUser(
    @CurrentUser() user,
    @Body() createDto: CreateSubAccountDto,
  ) {
    return this.subAccountsService.createSubAccountForUser(user.userId, createDto);
  }

  /**
   * Join existing subaccount (for ONBOARDING users)
   * Moves user from ONBOARDING workspace to target workspace
   */
  @Post('join')
  @AllowOnboarding() // Explicitly allow ONBOARDING users
  join(
    @CurrentUser() user,
    @Body() joinDto: JoinSubAccountDto,
  ) {
    return this.subAccountsService.joinSubAccount(user.userId, joinDto);
  }

  /**
   * Check if user is in ONBOARDING
   * Accessible to all authenticated users
   */
  @Get('status')
  @AllowOnboarding()
  async getStatus(@CurrentUser() user) {
    return this.subAccountsService.getOnboardingStatus(user.userId);
  }

  /**
   * Create invitation code (admin only)
   * Creates a unique code that allows users to join a workspace
   */
  @Post('invitations')
  @Roles('admin', 'super_admin')
  @UseGuards(RolesGuard)
  createInvitation(
    @CurrentUser() user,
    @Body() createDto: CreateInvitationDto,
  ) {
    return this.subAccountsService.createInvitation(
      user.userId,
      createDto,
    );
  }

  /**
   * Validate invitation code (public - for preview)
   * Allows ONBOARDING users to check if an invitation code is valid
   */
  @Get('invitations/:code/validate')
  @AllowOnboarding()
  validateInvitation(@Param('code') code: string) {
    return this.subAccountsService.validateInvitationCode(code);
  }

  /**
   * List all invitations for a subaccount (admin only)
   */
  @Get(':subAccountId/invitations')
  @Roles('admin', 'super_admin')
  @UseGuards(RolesGuard)
  listInvitations(@Param('subAccountId') subAccountId: string) {
    return this.subAccountsService.listInvitations(parseInt(subAccountId, 10));
  }
}
