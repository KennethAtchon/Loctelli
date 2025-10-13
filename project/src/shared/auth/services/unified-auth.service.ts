import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { AuthValidation, AccountType } from '../utils/validation.utils';
import { SecurityService } from './security.service';
import { AdminAuthCodeService } from './admin-auth-code.service';
import {
  UnifiedLoginDto,
  UnifiedRegisterDto,
  UnifiedJwtPayload,
  AuthResponse,
  TokenPair,
} from '../dto/unified-auth.dto';

@Injectable()
export class UnifiedAuthService {
  private readonly logger = new Logger(UnifiedAuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private securityService: SecurityService,
    private adminAuthCodeService: AdminAuthCodeService,
  ) {}

  /**
   * Unified login for both users and admins
   */
  async login(
    loginDto: UnifiedLoginDto,
    ipAddress: string,
    userAgent?: string,
  ): Promise<AuthResponse> {
    this.logger.log(`Login attempt: ${loginDto.email} (${loginDto.accountType})`);

    // Validate email format
    AuthValidation.validateEmail(loginDto.email);
    AuthValidation.validateAccountType(loginDto.accountType);

    // Check if account is locked
    const isLocked = await this.securityService.isAccountLocked(
      loginDto.email,
      loginDto.accountType,
    );

    if (isLocked) {
      this.logger.warn(`Login blocked - account locked: ${loginDto.email}`);
      throw new UnauthorizedException('Account is temporarily locked due to multiple failed login attempts');
    }

    // Route to appropriate login method
    if (loginDto.accountType === 'admin') {
      return this.loginAdmin(loginDto, ipAddress, userAgent);
    }

    return this.loginUser(loginDto, ipAddress, userAgent);
  }

  /**
   * User login
   */
  private async loginUser(
    loginDto: UnifiedLoginDto,
    ipAddress: string,
    userAgent?: string,
  ): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: { subAccount: true },
    });

    if (!user) {
      await this.securityService.recordFailedLogin(
        loginDto.email,
        'user',
        ipAddress,
        userAgent,
        'invalid_credentials',
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      await this.securityService.recordFailedLogin(
        loginDto.email,
        'user',
        ipAddress,
        userAgent,
        'invalid_credentials',
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      await this.securityService.recordFailedLogin(
        loginDto.email,
        'user',
        ipAddress,
        userAgent,
        'account_inactive',
      );
      throw new UnauthorizedException('Account is deactivated');
    }

    // Successful login - reset lockout
    await this.securityService.resetAccountLockout(loginDto.email, 'user');

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokenExpirations = this.getTokenExpirations(loginDto.rememberMe);
    const tokens = await this.generateTokens(
      user,
      'user',
      ipAddress,
      userAgent,
      tokenExpirations,
    );

    // Record successful login
    await this.securityService.recordLoginAttempt({
      email: loginDto.email,
      accountType: 'user',
      success: true,
      ipAddress,
      userAgent,
    });

    this.logger.log(`User login successful: ${user.email} (ID: ${user.id})`);

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company ?? undefined,
        subAccountId: user.subAccountId,
      },
    };
  }

  /**
   * Admin login
   */
  private async loginAdmin(
    loginDto: UnifiedLoginDto,
    ipAddress: string,
    userAgent?: string,
  ): Promise<AuthResponse> {
    const admin = await this.prisma.adminUser.findUnique({
      where: { email: loginDto.email },
    });

    if (!admin) {
      await this.securityService.recordFailedLogin(
        loginDto.email,
        'admin',
        ipAddress,
        userAgent,
        'invalid_credentials',
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, admin.password);

    if (!isPasswordValid) {
      await this.securityService.recordFailedLogin(
        loginDto.email,
        'admin',
        ipAddress,
        userAgent,
        'invalid_credentials',
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!admin.isActive) {
      await this.securityService.recordFailedLogin(
        loginDto.email,
        'admin',
        ipAddress,
        userAgent,
        'account_inactive',
      );
      throw new UnauthorizedException('Admin account is deactivated');
    }

    // Successful login - reset lockout
    await this.securityService.resetAccountLockout(loginDto.email, 'admin');

    // Update last login
    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokenExpirations = this.getTokenExpirations(loginDto.rememberMe);
    const tokens = await this.generateTokens(
      admin,
      'admin',
      ipAddress,
      userAgent,
      tokenExpirations,
    );

    // Record successful login
    await this.securityService.recordLoginAttempt({
      email: loginDto.email,
      accountType: 'admin',
      success: true,
      ipAddress,
      userAgent,
    });

    this.logger.log(`Admin login successful: ${admin.email} (ID: ${admin.id})`);

    return {
      ...tokens,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
      },
    };
  }

  /**
   * Unified registration for both users and admins
   */
  async register(registerDto: UnifiedRegisterDto): Promise<any> {
    this.logger.log(`Registration attempt: ${registerDto.email} (${registerDto.accountType})`);

    // Validate inputs
    AuthValidation.validateEmail(registerDto.email);
    AuthValidation.validatePassword(registerDto.password, registerDto.accountType);
    AuthValidation.validateAccountType(registerDto.accountType);

    // Route to appropriate registration method
    if (registerDto.accountType === 'admin') {
      return this.registerAdmin(registerDto);
    }

    return this.registerUser(registerDto);
  }

  /**
   * User registration
   */
  private async registerUser(registerDto: UnifiedRegisterDto): Promise<any> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    // Get or create default SubAccount
    let defaultSubAccount = await this.prisma.subAccount.findFirst({
      where: { name: 'Default SubAccount' },
    });

    if (!defaultSubAccount) {
      const defaultAdmin = await this.prisma.adminUser.findFirst({
        where: { role: 'super_admin' },
      });

      if (!defaultAdmin) {
        throw new BadRequestException('No admin available to create SubAccount');
      }

      defaultSubAccount = await this.prisma.subAccount.create({
        data: {
          name: 'Default SubAccount',
          description: 'Default SubAccount for new users',
          createdByAdminId: defaultAdmin.id,
        },
      });
    }

    // Create user
    const user = await this.prisma.user.create({
      data: {
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
        company: registerDto.company,
        budget: registerDto.budget,
        subAccountId: defaultSubAccount.id,
      },
    });

    this.logger.log(`User registration successful: ${user.email} (ID: ${user.id})`);

    const { password, ...result } = user;
    return result;
  }

  /**
   * Admin registration (requires auth code)
   */
  private async registerAdmin(registerDto: UnifiedRegisterDto): Promise<any> {
    // Validate auth code
    if (!registerDto.authCode) {
      throw new BadRequestException('Admin registration requires an authorization code');
    }

    const isValidAuthCode = this.adminAuthCodeService.validateAuthCode(registerDto.authCode);

    if (!isValidAuthCode) {
      throw new BadRequestException('Invalid authorization code');
    }

    // Validate role
    if (!registerDto.role || !['admin', 'super_admin'].includes(registerDto.role)) {
      throw new BadRequestException('Invalid admin role');
    }

    // Check if admin already exists
    const existingAdmin = await this.prisma.adminUser.findUnique({
      where: { email: registerDto.email },
    });

    if (existingAdmin) {
      throw new ConflictException('Admin with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    // Create admin
    const admin = await this.prisma.adminUser.create({
      data: {
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
        role: registerDto.role,
      },
    });

    this.logger.log(`Admin registration successful: ${admin.email} (ID: ${admin.id})`);

    const { password, ...result } = admin;
    return result;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string, ipAddress: string): Promise<TokenPair> {
    this.logger.debug('Token refresh attempt');

    try {
      // Verify JWT signature
      const payload = this.jwtService.verify(refreshToken) as UnifiedJwtPayload;

      // Check if refresh token exists in database and is not revoked
      const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { tokenHash },
      });

      if (!storedToken || storedToken.revokedAt) {
        throw new UnauthorizedException('Invalid or revoked refresh token');
      }

      // Check if token has expired
      if (storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token expired');
      }

      // Get user/admin and verify active status
      const account = await this.getAccountByIdAndType(payload.sub, payload.accountType);

      if (!account || !account.isActive) {
        throw new UnauthorizedException('Account not found or inactive');
      }

      // Generate new token pair
      const newTokens = await this.generateTokens(
        account,
        payload.accountType,
        ipAddress,
        storedToken.userAgent ?? undefined,
      );

      // Revoke old refresh token
      await this.prisma.refreshToken.update({
        where: { tokenHash },
        data: { revokedAt: new Date() },
      });

      this.logger.log(`Token refresh successful for ${payload.accountType}: ${payload.email}`);

      return newTokens;
    } catch (error) {
      this.logger.error('Token refresh failed', error.stack);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout - revoke refresh token
   */
  async logout(userId: number, accountType: AccountType): Promise<{ message: string }> {
    this.logger.log(`Logout: ${accountType} ID ${userId}`);

    // Revoke all refresh tokens for this user
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        accountType,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return { message: 'Logged out successfully' };
  }

  /**
   * Get user/admin profile
   */
  async getProfile(userId: number, accountType: AccountType): Promise<any> {
    if (accountType === 'admin') {
      const admin = await this.prisma.adminUser.findUnique({
        where: { id: userId },
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
      });

      if (!admin) {
        throw new UnauthorizedException('Admin not found');
      }

      return admin;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        company: true,
        budget: true,
        bookingEnabled: true,
        calendarId: true,
        locationId: true,
        subAccountId: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  /**
   * Change password
   */
  async changePassword(
    userId: number,
    accountType: AccountType,
    oldPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    this.logger.log(`Password change attempt for ${accountType} ID ${userId}`);

    // Validate new password
    AuthValidation.validatePassword(newPassword, accountType);

    // Get account
    const account = await this.getAccountByIdAndType(userId, accountType);

    if (!account) {
      throw new UnauthorizedException('Account not found');
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, account.password);

    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check if new password is different
    const isNewPasswordSame = await bcrypt.compare(newPassword, account.password);

    if (isNewPasswordSame) {
      throw new BadRequestException('New password must be different from current password');
    }

    // Check password history (prevent reuse of last 5 passwords for users, 10 for admins)
    const historyLimit = accountType === 'admin' ? 10 : 5;
    const passwordHistory = await this.prisma.passwordHistory.findMany({
      where: {
        userId,
        accountType,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: historyLimit,
    });

    for (const history of passwordHistory) {
      const isReused = await bcrypt.compare(newPassword, history.passwordHash);
      if (isReused) {
        throw new BadRequestException(
          `Cannot reuse any of your last ${historyLimit} passwords`,
        );
      }
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    if (accountType === 'admin') {
      await this.prisma.adminUser.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });
    } else {
      await this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });
    }

    // Store old password in history
    await this.prisma.passwordHistory.create({
      data: {
        userId,
        accountType,
        passwordHash: account.password,
      },
    });

    // Revoke all existing refresh tokens (force re-login)
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        accountType,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    this.logger.log(`Password changed successfully for ${accountType} ID ${userId}`);

    return { message: 'Password changed successfully. Please login again.' };
  }

  /**
   * Generate JWT token pair (access + refresh)
   */
  private async generateTokens(
    account: any,
    accountType: AccountType,
    ipAddress: string,
    userAgent?: string,
    expirations?: { access: string; refresh: string },
  ): Promise<TokenPair> {
    const payload: UnifiedJwtPayload = {
      sub: account.id,
      email: account.email,
      role: account.role,
      accountType,
      subAccountId: accountType === 'user' ? account.subAccountId : undefined,
      permissions: accountType === 'admin' ? account.permissions : undefined,
    };

    const accessExpiration = expirations?.access || '15m';
    const refreshExpiration = expirations?.refresh || '7d';

    const accessToken = this.jwtService.sign(payload, { expiresIn: accessExpiration });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: refreshExpiration });

    // Store refresh token in database
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(
      Date.now() + (refreshExpiration.includes('d') ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000),
    );

    await this.prisma.refreshToken.create({
      data: {
        userId: account.id,
        accountType,
        tokenHash,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  /**
   * Get account by ID and type
   */
  private async getAccountByIdAndType(userId: number, accountType: AccountType): Promise<any> {
    if (accountType === 'admin') {
      return this.prisma.adminUser.findUnique({
        where: { id: userId },
      });
    }

    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  /**
   * Get token expirations based on rememberMe option
   */
  private getTokenExpirations(rememberMe?: boolean) {
    if (rememberMe) {
      return {
        access: '15m',
        refresh: '30d', // Extended to 30 days for remember me
      };
    }

    return {
      access: '15m',
      refresh: '7d',
    };
  }
}
