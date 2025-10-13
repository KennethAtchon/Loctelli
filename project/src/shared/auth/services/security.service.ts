import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountType } from '../utils/validation.utils';

export interface LoginAttemptData {
  email: string;
  accountType: AccountType;
  success: boolean;
  ipAddress: string;
  userAgent?: string;
  failureReason?: string;
  geoLocation?: any;
  isNewLocation?: boolean;
  isNewDevice?: boolean;
}

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  // Account lockout thresholds
  private readonly LOCKOUT_THRESHOLDS = {
    LIGHT: { attempts: 5, duration: 15 * 60 * 1000 },  // 15 minutes
    MEDIUM: { attempts: 10, duration: 60 * 60 * 1000 }, // 1 hour
    HEAVY: { attempts: 15, duration: 24 * 60 * 60 * 1000 }, // 24 hours
  };

  constructor(private prisma: PrismaService) {}

  /**
   * Record a login attempt (success or failure)
   */
  async recordLoginAttempt(data: LoginAttemptData): Promise<void> {
    try {
      await this.prisma.authAttempt.create({
        data: {
          email: data.email,
          accountType: data.accountType,
          success: data.success,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          failureReason: data.failureReason,
          geoLocation: data.geoLocation,
          isNewLocation: data.isNewLocation || false,
          isNewDevice: data.isNewDevice || false,
        },
      });

      this.logger.log(
        `Login attempt recorded: ${data.email} (${data.accountType}) - ${data.success ? 'SUCCESS' : 'FAILED'}`
      );
    } catch (error) {
      this.logger.error(`Failed to record login attempt: ${error.message}`, error.stack);
    }
  }

  /**
   * Record a failed login attempt and update lockout status
   */
  async recordFailedLogin(
    email: string,
    accountType: AccountType,
    ipAddress: string,
    userAgent?: string,
    failureReason?: string,
  ): Promise<void> {
    // Record the attempt
    await this.recordLoginAttempt({
      email,
      accountType,
      success: false,
      ipAddress,
      userAgent,
      failureReason,
    });

    // Update or create lockout record
    const lockout = await this.prisma.accountLockout.upsert({
      where: {
        email_accountType: {
          email,
          accountType,
        },
      },
      update: {
        failedAttempts: {
          increment: 1,
        },
        lastAttemptAt: new Date(),
      },
      create: {
        email,
        accountType,
        failedAttempts: 1,
        lastAttemptAt: new Date(),
      },
    });

    // Determine if account should be locked
    const newLockoutDuration = this.calculateLockoutDuration(lockout.failedAttempts);

    if (newLockoutDuration) {
      const lockedUntil = new Date(Date.now() + newLockoutDuration);

      await this.prisma.accountLockout.update({
        where: {
          email_accountType: {
            email,
            accountType,
          },
        },
        data: {
          lockedUntil,
        },
      });

      this.logger.warn(
        `Account locked: ${email} (${accountType}) - ${lockout.failedAttempts} failed attempts - Locked until ${lockedUntil.toISOString()}`
      );
    }
  }

  /**
   * Check if an account is currently locked
   */
  async isAccountLocked(email: string, accountType: AccountType): Promise<boolean> {
    try {
      const lockout = await this.prisma.accountLockout.findUnique({
        where: {
          email_accountType: {
            email,
            accountType,
          },
        },
      });

      if (!lockout || !lockout.lockedUntil) {
        return false;
      }

      // Check if lockout has expired
      if (lockout.lockedUntil < new Date()) {
        // Lockout expired, reset the record
        await this.resetAccountLockout(email, accountType);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Error checking account lockout: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Get lockout information for an account
   */
  async getAccountLockoutInfo(email: string, accountType: AccountType) {
    return this.prisma.accountLockout.findUnique({
      where: {
        email_accountType: {
          email,
          accountType,
        },
      },
    });
  }

  /**
   * Reset account lockout after successful login
   */
  async resetAccountLockout(email: string, accountType: AccountType): Promise<void> {
    try {
      await this.prisma.accountLockout.update({
        where: {
          email_accountType: {
            email,
            accountType,
          },
        },
        data: {
          failedAttempts: 0,
          lockedUntil: null,
          lastAttemptAt: new Date(),
        },
      });

      this.logger.log(`Account lockout reset: ${email} (${accountType})`);
    } catch (error) {
      // If no lockout record exists, that's fine
      if (error.code !== 'P2025') {
        this.logger.error(`Error resetting account lockout: ${error.message}`, error.stack);
      }
    }
  }

  /**
   * Manually unlock an account (admin action)
   */
  async unlockAccount(email: string, accountType: AccountType): Promise<void> {
    await this.resetAccountLockout(email, accountType);
    this.logger.log(`Account manually unlocked: ${email} (${accountType})`);
  }

  /**
   * Calculate lockout duration based on failed attempt count
   */
  private calculateLockoutDuration(failedAttempts: number): number | null {
    if (failedAttempts >= this.LOCKOUT_THRESHOLDS.HEAVY.attempts) {
      return this.LOCKOUT_THRESHOLDS.HEAVY.duration;
    }

    if (failedAttempts >= this.LOCKOUT_THRESHOLDS.MEDIUM.attempts) {
      return this.LOCKOUT_THRESHOLDS.MEDIUM.duration;
    }

    if (failedAttempts >= this.LOCKOUT_THRESHOLDS.LIGHT.attempts) {
      return this.LOCKOUT_THRESHOLDS.LIGHT.duration;
    }

    return null;
  }

  /**
   * Get recent login history for a user
   */
  async getLoginHistory(
    email: string,
    accountType: AccountType,
    limit: number = 10,
  ) {
    return this.prisma.authAttempt.findMany({
      where: {
        email,
        accountType,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get authentication analytics (for admin dashboard)
   */
  async getAuthAnalytics(startDate?: Date, endDate?: Date) {
    const dateFilter = startDate && endDate
      ? {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        }
      : {};

    const [
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      lockedAccounts,
      suspiciousLogins,
    ] = await Promise.all([
      // Total attempts
      this.prisma.authAttempt.count({
        where: dateFilter,
      }),

      // Successful attempts
      this.prisma.authAttempt.count({
        where: {
          ...dateFilter,
          success: true,
        },
      }),

      // Failed attempts
      this.prisma.authAttempt.count({
        where: {
          ...dateFilter,
          success: false,
        },
      }),

      // Currently locked accounts
      this.prisma.accountLockout.count({
        where: {
          lockedUntil: {
            gte: new Date(),
          },
        },
      }),

      // Suspicious logins (new location/device)
      this.prisma.authAttempt.findMany({
        where: {
          ...dateFilter,
          success: true,
          OR: [
            { isNewLocation: true },
            { isNewDevice: true },
          ],
        },
        take: 20,
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    return {
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      successRate: totalAttempts > 0 ? successfulAttempts / totalAttempts : 0,
      lockedAccounts,
      suspiciousLogins,
    };
  }
}
