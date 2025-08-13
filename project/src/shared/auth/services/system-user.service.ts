import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SystemUserService {
  private readonly logger = new Logger(SystemUserService.name);
  private readonly SYSTEM_USER_EMAIL = 'user@loctelli.com';
  private readonly SYSTEM_USER_ID = 1; // Known ID from database
  
  constructor(private prisma: PrismaService) {}

  /**
   * Get the system user that all admins will use for user-specific operations
   */
  async getSystemUser() {
    const systemUser = await this.prisma.user.findUnique({
      where: { id: this.SYSTEM_USER_ID },
      include: {
        subAccount: true,
      },
    });

    if (!systemUser) {
      this.logger.error(`System user not found with ID: ${this.SYSTEM_USER_ID}`);
      throw new Error('System user not found. Please contact administrator.');
    }

    if (!systemUser.isActive) {
      this.logger.error(`System user is inactive: ${this.SYSTEM_USER_EMAIL}`);
      throw new Error('System user is inactive. Please contact administrator.');
    }

    return systemUser;
  }

  /**
   * Get system user ID for admin operations
   */
  getSystemUserId(): number {
    return this.SYSTEM_USER_ID;
  }

  /**
   * Get system user email
   */
  getSystemUserEmail(): string {
    return this.SYSTEM_USER_EMAIL;
  }

  /**
   * Ensure system user has a secure password (called during startup)
   */
  async ensureSystemUserSecurity() {
    this.logger.log('🔒 Ensuring system user security...');
    
    try {
      const systemUser = await this.prisma.user.findUnique({
        where: { id: this.SYSTEM_USER_ID },
      });

      if (!systemUser) {
        this.logger.error('System user not found during security check');
        return;
      }

      // Generate an extremely secure password that cannot be guessed
      const securePassword = this.generateSecureSystemPassword();
      const hashedPassword = await bcrypt.hash(securePassword, 15); // Very high salt rounds

      // Update the system user with secure password
      await this.prisma.user.update({
        where: { id: this.SYSTEM_USER_ID },
        data: {
          password: hashedPassword,
          role: 'system', // Mark as system user
          updatedAt: new Date(),
        },
      });

      this.logger.log('✅ System user security updated successfully');
    } catch (error) {
      this.logger.error('❌ Failed to update system user security:', error);
    }
  }

  /**
   * Generate an extremely secure password for the system user
   */
  private generateSecureSystemPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    const length = 128; // Very long password
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Add timestamp and random suffix to make it unique
    return `${password}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Check if a user object represents an admin user
   */
  isAdminUser(user: any): boolean {
    return user && user.type === 'admin';
  }

  /**
   * Get the effective regular user ID for operations
   * Returns system user ID for admins, original user ID for regular users
   */
  getEffectiveRegularUserId(user: any): number {
    if (this.isAdminUser(user)) {
      this.logger.debug(`Admin user ${user.email} mapped to system user ID: ${this.SYSTEM_USER_ID}`);
      return this.SYSTEM_USER_ID;
    }
    
    this.logger.debug(`Regular user ${user.email} using their own ID: ${user.userId}`);
    return user.userId;
  }

  /**
   * Get the effective admin user ID for operations (for future admin-specific features)
   * Returns admin user ID for admins, null for regular users
   */
  getEffectiveAdminUserId(user: any): number | null {
    if (this.isAdminUser(user)) {
      return user.userId; // This is the admin's real ID
    }
    
    return null; // Regular users don't have admin IDs
  }

  /**
   * Get the effective user for operations
   * Returns system user for admins, original user for regular users
   */
  async getEffectiveUser(user: any) {
    if (this.isAdminUser(user)) {
      return await this.getSystemUser();
    }
    
    // For regular users, fetch their full user record
    return await this.prisma.user.findUnique({
      where: { id: user.userId },
      include: {
        subAccount: true,
      },
    });
  }

  /**
   * Get the subAccount ID for operations
   * Returns system user's subAccount for admins, user's subAccount for regular users
   */
  async getEffectiveSubAccountId(user: any): Promise<number> {
    if (this.isAdminUser(user)) {
      const systemUser = await this.getSystemUser();
      return systemUser.subAccountId;
    }
    
    // For regular users, use their subAccount
    const regularUser = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { subAccountId: true },
    });
    
    if (!regularUser) {
      throw new Error('User not found');
    }
    
    return regularUser.subAccountId;
  }

  /**
   * Log admin operation for audit purposes
   */
  logAdminOperation(adminUser: any, operation: string, details?: any) {
    this.logger.log(`🔧 Admin Operation: ${adminUser.email} (ID: ${adminUser.userId}) performed ${operation}`, {
      adminId: adminUser.userId,
      adminEmail: adminUser.email,
      operation,
      systemUserId: this.SYSTEM_USER_ID,
      timestamp: new Date().toISOString(),
      details,
    });
  }
}