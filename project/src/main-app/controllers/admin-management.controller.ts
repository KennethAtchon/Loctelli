import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/auth/auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AdminAuthCodeService } from '../../shared/auth/services/admin-auth-code.service';
import * as bcrypt from 'bcrypt';

/**
 * Admin Management Controller
 * Handles admin-only operations for managing users and other admins
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminManagementController {
  private readonly logger = new Logger(AdminManagementController.name);

  constructor(
    private prisma: PrismaService,
    private adminAuthCodeService: AdminAuthCodeService,
  ) {}

  // ============================================
  // USER MANAGEMENT ENDPOINTS
  // ============================================

  /**
   * Get all users (admin only)
   */
  @Get('users')
  @Roles('admin', 'super_admin')
  async getAllUsers(
    @CurrentUser() currentUser,
    @Query('subaccountId') subaccountId?: string,
  ) {
    this.logger.log(
      `👥 All users request by admin: ${currentUser.email} (ID: ${currentUser.userId})${subaccountId ? ` for subaccount: ${subaccountId}` : ''}`,
    );

    try {
      const where = subaccountId ? { subAccountId: parseInt(subaccountId, 10) } : {};

      const users = await this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          company: true,
          budget: true,
          subAccountId: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      this.logger.log(
        `✅ All users retrieved by admin: ${currentUser.email} - ${users.length} users`,
      );

      return users;
    } catch (error) {
      this.logger.error(
        `❌ All users retrieval failed by admin: ${currentUser.email}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Create a new user (admin only)
   */
  @Post('users')
  @Roles('admin', 'super_admin')
  async createUser(
    @CurrentUser() currentUser,
    @Body()
    userData: {
      name: string;
      email: string;
      password: string;
      company?: string;
      budget?: string;
      role?: string;
      subAccountId?: number;
    },
  ) {
    this.logger.log(
      `👤 User creation by admin: ${currentUser.email} for email: ${userData.email}`,
    );

    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        throw new BadRequestException('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Determine subAccountId
      let subAccountId = userData.subAccountId;
      if (!subAccountId) {
        // Get default SubAccount
        const defaultSubAccount = await this.prisma.subAccount.findFirst({
          where: { name: 'Default SubAccount' },
        });

        if (!defaultSubAccount) {
          throw new BadRequestException('No default SubAccount found');
        }

        subAccountId = defaultSubAccount.id;
      }

      // Create user
      const user = await this.prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          company: userData.company,
          budget: userData.budget,
          role: userData.role || 'user',
          subAccountId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          company: true,
          budget: true,
          subAccountId: true,
          isActive: true,
          createdAt: true,
        },
      });

      this.logger.log(
        `✅ User created by admin: ${currentUser.email} - User ID: ${user.id}, Email: ${userData.email}`,
      );

      return user;
    } catch (error) {
      this.logger.error(
        `❌ User creation failed by admin: ${currentUser.email} for email: ${userData.email}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Update a user (admin only)
   */
  @Put('users/:id')
  @Roles('admin', 'super_admin')
  async updateUser(
    @CurrentUser() currentUser,
    @Param('id', ParseIntPipe) userId: number,
    @Body()
    userData: {
      name?: string;
      email?: string;
      role?: string;
      company?: string;
      budget?: string;
      isActive?: boolean;
    },
  ) {
    this.logger.log(
      `✏️ User update by admin: ${currentUser.email} for user ID: ${userId}`,
    );

    try {
      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        throw new BadRequestException('User not found');
      }

      // If email is being changed, check for conflicts
      if (userData.email && userData.email !== existingUser.email) {
        const emailConflict = await this.prisma.user.findUnique({
          where: { email: userData.email },
        });

        if (emailConflict) {
          throw new BadRequestException('Email already in use');
        }
      }

      // Update user
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: userData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          company: true,
          budget: true,
          subAccountId: true,
          isActive: true,
          updatedAt: true,
        },
      });

      this.logger.log(
        `✅ User updated by admin: ${currentUser.email} - User ID: ${userId}`,
      );

      return updatedUser;
    } catch (error) {
      this.logger.error(
        `❌ User update failed by admin: ${currentUser.email} for user ID: ${userId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Delete a user (admin only)
   */
  @Delete('users/:id')
  @Roles('admin', 'super_admin')
  async deleteUser(
    @CurrentUser() currentUser,
    @Param('id', ParseIntPipe) userId: number,
  ) {
    this.logger.log(
      `🗑️ User deletion by admin: ${currentUser.email} for user ID: ${userId}`,
    );

    try {
      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        throw new BadRequestException('User not found');
      }

      // Delete user (soft delete by setting isActive to false)
      await this.prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      });

      this.logger.log(
        `✅ User deleted by admin: ${currentUser.email} - User ID: ${userId}`,
      );

      return { message: 'User deleted successfully' };
    } catch (error) {
      this.logger.error(
        `❌ User deletion failed by admin: ${currentUser.email} for user ID: ${userId}`,
        error.stack,
      );
      throw error;
    }
  }

  // ============================================
  // ADMIN MANAGEMENT ENDPOINTS (Super Admin Only)
  // ============================================

  /**
   * Get all admin accounts (super admin only)
   */
  @Get('accounts')
  @Roles('super_admin')
  async getAllAdminAccounts(@CurrentUser() currentUser) {
    this.logger.log(
      `👥 All admin accounts request by super admin: ${currentUser.email}`,
    );

    try {
      const admins = await this.prisma.adminUser.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          permissions: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      this.logger.log(
        `✅ All admin accounts retrieved by super admin: ${currentUser.email} - ${admins.length} accounts`,
      );

      return admins;
    } catch (error) {
      this.logger.error(
        `❌ All admin accounts retrieval failed by super admin: ${currentUser.email}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Delete an admin account (super admin only)
   */
  @Delete('accounts/:id')
  @Roles('super_admin')
  async deleteAdminAccount(
    @CurrentUser() currentUser,
    @Param('id', ParseIntPipe) adminId: number,
  ) {
    this.logger.log(
      `🗑️ Admin account deletion by super admin: ${currentUser.email} for admin ID: ${adminId}`,
    );

    try {
      // Prevent deleting self
      if (adminId === currentUser.userId) {
        throw new BadRequestException('Cannot delete your own account');
      }

      // Check if admin exists
      const existingAdmin = await this.prisma.adminUser.findUnique({
        where: { id: adminId },
      });

      if (!existingAdmin) {
        throw new BadRequestException('Admin account not found');
      }

      // Soft delete admin
      await this.prisma.adminUser.update({
        where: { id: adminId },
        data: { isActive: false },
      });

      this.logger.log(
        `✅ Admin account deleted by super admin: ${currentUser.email} - Admin ID: ${adminId}`,
      );

      return { message: 'Admin account deleted successfully' };
    } catch (error) {
      this.logger.error(
        `❌ Admin account deletion failed by super admin: ${currentUser.email} for admin ID: ${adminId}`,
        error.stack,
      );
      throw error;
    }
  }

  // ============================================
  // AUTH CODE MANAGEMENT (Super Admin Only)
  // ============================================

  /**
   * Generate a new admin auth code (super admin only)
   */
  @Post('auth-code/generate')
  @Roles('super_admin')
  async generateAuthCode(@CurrentUser() currentUser) {
    this.logger.log(
      `🔑 Auth code generation by super admin: ${currentUser.email}`,
    );

    try {
      const authCode = this.adminAuthCodeService.generateAuthCode(20);

      this.logger.log(
        `✅ Auth code generated by super admin: ${currentUser.email}`,
      );

      return {
        authCode,
        message: 'Admin authorization code generated successfully',
        expiresIn: 'Never (until changed in environment)',
      };
    } catch (error) {
      this.logger.error(
        `❌ Auth code generation failed by super admin: ${currentUser.email}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get current admin auth code (super admin only)
   */
  @Get('auth-code/current')
  @Roles('super_admin')
  async getCurrentAuthCode(@CurrentUser() currentUser) {
    this.logger.log(
      `🔍 Current auth code request by super admin: ${currentUser.email}`,
    );

    try {
      const authCode = this.adminAuthCodeService.getCurrentAuthCode();

      this.logger.log(
        `✅ Current auth code retrieved by super admin: ${currentUser.email}`,
      );

      return {
        authCode,
        message: 'Current admin authorization code',
      };
    } catch (error) {
      this.logger.error(
        `❌ Current auth code retrieval failed by super admin: ${currentUser.email}`,
        error.stack,
      );
      throw error;
    }
  }

  // ============================================
  // SECURITY ENDPOINTS
  // ============================================

  /**
   * Get login attempts for a specific email (super admin only)
   */
  @Get('security/login-attempts/:email')
  @Roles('super_admin')
  async getLoginAttempts(
    @CurrentUser() currentUser,
    @Param('email') email: string,
  ) {
    this.logger.log(
      `🔍 Login attempts request by super admin: ${currentUser.email} for email: ${email}`,
    );

    try {
      const attempts = await this.prisma.authAttempt.findMany({
        where: { email },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      this.logger.log(
        `✅ Login attempts retrieved by super admin: ${currentUser.email} - ${attempts.length} attempts`,
      );

      return attempts;
    } catch (error) {
      this.logger.error(
        `❌ Login attempts retrieval failed by super admin: ${currentUser.email}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Unlock an account (super admin only)
   */
  @Post('security/unlock/:email')
  @Roles('super_admin')
  async unlockAccount(
    @CurrentUser() currentUser,
    @Param('email') email: string,
    @Body() body: { accountType: 'user' | 'admin' },
  ) {
    this.logger.log(
      `🔓 Account unlock by super admin: ${currentUser.email} for email: ${email} (${body.accountType})`,
    );

    try {
      // Delete account lockout record
      await this.prisma.accountLockout.deleteMany({
        where: {
          email,
          accountType: body.accountType,
        },
      });

      this.logger.log(
        `✅ Account unlocked by super admin: ${currentUser.email} - ${email}`,
      );

      return { message: 'Account unlocked successfully' };
    } catch (error) {
      this.logger.error(
        `❌ Account unlock failed by super admin: ${currentUser.email} for email: ${email}`,
        error.stack,
      );
      throw error;
    }
  }
}
