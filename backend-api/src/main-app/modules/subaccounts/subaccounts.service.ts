import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateSubAccountDto } from './dto/create-subaccount.dto';
import { UpdateSubAccountDto } from './dto/update-subaccount.dto';
import { JoinSubAccountDto } from './dto/join-subaccount.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { ONBOARDING_SUBACCOUNT_ID } from '../../../shared/constants/tenant.constants';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class SubAccountsService {
  private readonly logger = new Logger(SubAccountsService.name);

  constructor(private prisma: PrismaService) {}

  create(adminId: number, createSubAccountDto: CreateSubAccountDto) {
    return this.prisma.subAccount.create({
      data: {
        ...createSubAccountDto,
        createdByAdminId: adminId,
      },
      include: {
        createdByAdmin: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            users: true,
            strategies: true,
            leads: true,
            bookings: true,
          },
        },
      },
    });
  }

  findAll(adminId: number) {
    // All admins can see all subaccounts
    return this.prisma.subAccount.findMany({
      include: {
        createdByAdmin: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            users: true,
            strategies: true,
            leads: true,
            bookings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, adminId: number) {
    const subAccount = await this.prisma.subAccount.findFirst({
      where: { id },
      include: {
        createdByAdmin: {
          select: { id: true, name: true, email: true },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        strategies: {
          select: {
            id: true,
            name: true,
            tag: true,
            aiName: true,
            createdAt: true,
          },
        },
        leads: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
        bookings: {
          select: {
            id: true,
            bookingType: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!subAccount) {
      throw new NotFoundException('SubAccount not found');
    }

    return subAccount;
  }

  async update(
    id: number,
    adminId: number,
    updateSubAccountDto: UpdateSubAccountDto,
  ) {
    const subAccount = await this.prisma.subAccount.findFirst({
      where: { id },
    });

    if (!subAccount) {
      throw new NotFoundException('SubAccount not found');
    }

    return this.prisma.subAccount.update({
      where: { id },
      data: updateSubAccountDto,
      include: {
        createdByAdmin: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async remove(id: number, adminId: number) {
    const subAccount = await this.prisma.subAccount.findFirst({
      where: { id },
    });

    if (!subAccount) {
      throw new NotFoundException('SubAccount not found');
    }

    // Cascade delete will handle all related data
    await this.prisma.subAccount.delete({ where: { id } });
    return { message: 'SubAccount deleted successfully' };
  }

  // Helper method to validate SubAccount access
  async validateSubAccountAccess(
    userId: number,
    subAccountId: number,
    userType: 'admin' | 'user',
  ) {
    if (userType === 'admin') {
      // All admins can access any subaccount
      const subAccount = await this.prisma.subAccount.findFirst({
        where: { id: subAccountId },
      });
      if (!subAccount) {
        throw new ForbiddenException('SubAccount not found');
      }
      return subAccount;
    } else {
      const user = await this.prisma.user.findFirst({
        where: { id: userId, subAccountId },
      });
      if (!user) {
        throw new ForbiddenException('Access denied to SubAccount');
      }
      return user;
    }
  }

  // ========== ONBOARDING METHODS ==========

  /**
   * Create a new subaccount for a user (moves them from ONBOARDING)
   */
  async createSubAccountForUser(
    userId: number,
    createDto: CreateSubAccountDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.subAccountId !== ONBOARDING_SUBACCOUNT_ID) {
      throw new BadRequestException('User already belongs to a subaccount');
    }

    // Create new subaccount
    const subAccount = await this.prisma.subAccount.create({
      data: {
        name: createDto.name,
        description: createDto.description,
        settings: createDto.settings || {},
        createdByAdminId: user.createdByAdminId || 1, // Fallback to system admin
      },
    });

    // Move user from ONBOARDING to new subaccount and make them admin
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        subAccountId: subAccount.id,
        role: 'admin', // User becomes admin of their own subaccount
      },
    });

    this.logger.log(
      `User ${userId} created subaccount ${subAccount.id} and became admin`,
    );

    return subAccount;
  }

  /**
   * Join an existing subaccount using invitation code
   */
  async joinSubAccount(userId: number, joinDto: JoinSubAccountDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.subAccountId !== ONBOARDING_SUBACCOUNT_ID) {
      throw new BadRequestException('User already belongs to a subaccount');
    }

    // Find and validate invitation
    const invitation = await this.prisma.subAccountInvitation.findUnique({
      where: { code: joinDto.invitationCode },
      include: { subAccount: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invalid invitation code');
    }

    if (!invitation.isActive) {
      throw new BadRequestException('Invitation is no longer active');
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    if (invitation.maxUses && invitation.currentUses >= invitation.maxUses) {
      throw new BadRequestException('Invitation has reached maximum uses');
    }

    // Validate password if required
    if (invitation.password) {
      const isPasswordValid = await bcrypt.compare(
        joinDto.password || '',
        invitation.password,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid invitation password');
      }
    }

    // Move user from ONBOARDING to target subaccount
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        subAccountId: invitation.subAccountId,
      },
    });

    // Increment invitation usage count
    await this.prisma.subAccountInvitation.update({
      where: { id: invitation.id },
      data: {
        currentUses: { increment: 1 },
      },
    });

    this.logger.log(
      `User ${userId} joined subaccount ${invitation.subAccountId} via invitation`,
    );

    return invitation.subAccount;
  }

  /**
   * Check if user is in ONBOARDING
   */
  async isUserInOnboarding(userId: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { subAccountId: true },
    });

    return user?.subAccountId === ONBOARDING_SUBACCOUNT_ID;
  }

  /**
   * Get onboarding status for user
   */
  async getOnboardingStatus(userId: number) {
    const isOnboarding = await this.isUserInOnboarding(userId);
    return {
      isOnboarding,
      requiresSetup: isOnboarding,
      subAccountId: isOnboarding ? ONBOARDING_SUBACCOUNT_ID : null,
    };
  }

  /**
   * Create invitation code (admin only)
   */
  async createInvitation(adminId: number, createDto: CreateInvitationDto) {
    // Verify subaccount exists
    const subAccount = await this.prisma.subAccount.findUnique({
      where: { id: createDto.subAccountId },
    });

    if (!subAccount) {
      throw new NotFoundException('SubAccount not found');
    }

    // Generate unique invitation code
    const code = this.generateInvitationCode();

    // Hash password if provided
    let hashedPassword: string | null = null;
    if (createDto.password) {
      hashedPassword = await bcrypt.hash(createDto.password, 10);
    }

    // Create invitation
    const invitation = await this.prisma.subAccountInvitation.create({
      data: {
        code,
        subAccountId: createDto.subAccountId,
        password: hashedPassword,
        maxUses: createDto.maxUses,
        expiresAt: createDto.expiresAt ? new Date(createDto.expiresAt) : null,
        isActive: createDto.isActive !== undefined ? createDto.isActive : true,
        createdByAdminId: adminId,
      },
      include: {
        subAccount: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(
      `Admin ${adminId} created invitation ${invitation.code} for subaccount ${createDto.subAccountId}`,
    );

    return invitation;
  }

  /**
   * Validate invitation code (public - for preview)
   */
  async validateInvitationCode(code: string) {
    const invitation = await this.prisma.subAccountInvitation.findUnique({
      where: { code },
      include: {
        subAccount: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invalid invitation code');
    }

    // Check if invitation is valid
    const isValid =
      invitation.isActive &&
      (!invitation.expiresAt || invitation.expiresAt > new Date()) &&
      (!invitation.maxUses || invitation.currentUses < invitation.maxUses);

    return {
      valid: isValid,
      subAccount: invitation.subAccount,
      requiresPassword: !!invitation.password,
      maxUses: invitation.maxUses,
      currentUses: invitation.currentUses,
      expiresAt: invitation.expiresAt,
    };
  }

  /**
   * List all invitations for a subaccount (admin only)
   */
  listInvitations(subAccountId: number) {
    return this.prisma.subAccountInvitation.findMany({
      where: { subAccountId },
      include: {
        createdByAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Generate a unique invitation code
   */
  private generateInvitationCode(): string {
    // Generate a random 8-character alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const bytes = randomBytes(8);
    let code = '';

    for (let i = 0; i < 8; i++) {
      code += chars[bytes[i] % chars.length];
    }

    return code;
  }
}
