import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
  Ip,
  Headers,
} from '@nestjs/common';
import { UnifiedAuthService } from '../../shared/auth/services/unified-auth.service';
import {
  UnifiedLoginDto,
  UnifiedRegisterDto,
  ChangePasswordDto,
  RefreshTokenDto,
} from '../../shared/auth/dto/unified-auth.dto';
import { JwtAuthGuard } from '../../shared/auth/auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Public } from '../../shared/decorators/public.decorator';

@Controller('auth')
export class UnifiedAuthController {
  private readonly logger = new Logger(UnifiedAuthController.name);

  constructor(private readonly unifiedAuthService: UnifiedAuthService) {}

  /**
   * Unified login endpoint for both users and admins
   * Rate limited to 5 attempts per minute per IP
   */
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  // Rate limiting handled by RateLimitMiddleware (5 requests per 15 minutes)
  async login(
    @Body() loginDto: UnifiedLoginDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    this.logger.log(
      `🔐 Login attempt: ${loginDto.email} (${loginDto.accountType}) from IP: ${ipAddress}`,
    );
    this.logger.debug(
      `Login request: ${JSON.stringify({ ...loginDto, password: '[REDACTED]' })}`,
    );

    try {
      const result = await this.unifiedAuthService.login(
        loginDto,
        ipAddress,
        userAgent,
      );

      const accountInfo = result.user
        ? `User ID: ${result.user.id}`
        : `Admin ID: ${result.admin?.id}`;

      this.logger.log(
        `✅ Login successful: ${loginDto.email} (${loginDto.accountType}) - ${accountInfo}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `❌ Login failed: ${loginDto.email} (${loginDto.accountType}) from IP: ${ipAddress}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Unified registration endpoint for both users and admins
   * Rate limited to 3 attempts per minute per IP
   */
  @Post('register')
  @Public()
  // Rate limiting handled by RateLimitMiddleware (5 requests per 15 minutes)
  async register(@Body() registerDto: UnifiedRegisterDto) {
    this.logger.log(
      `📝 Registration attempt: ${registerDto.email} (${registerDto.accountType})`,
    );
    this.logger.debug(
      `Registration data: ${JSON.stringify({ ...registerDto, password: '[REDACTED]', authCode: registerDto.authCode ? '[REDACTED]' : undefined })}`,
    );

    try {
      const result = await this.unifiedAuthService.register(registerDto);
      this.logger.log(
        `✅ Registration successful: ${registerDto.email} (${registerDto.accountType}) - ID: ${result.id}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `❌ Registration failed: ${registerDto.email} (${registerDto.accountType})`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   * Rate limited to 10 attempts per minute per IP
   */
  @Post('refresh')
  @Public()
  // Rate limiting handled by RateLimitMiddleware (default: 100 requests per 15 minutes)
  async refreshToken(@Body() body: RefreshTokenDto, @Ip() ipAddress: string) {
    this.logger.log(`🔄 Token refresh attempt from IP: ${ipAddress}`);
    this.logger.debug(
      `Refresh token: ${body.refresh_token.substring(0, 20)}...`,
    );

    try {
      const result = await this.unifiedAuthService.refreshToken(
        body.refresh_token,
        ipAddress,
      );
      this.logger.log(`✅ Token refresh successful from IP: ${ipAddress}`);
      return result;
    } catch (error) {
      this.logger.error(
        `❌ Token refresh failed from IP: ${ipAddress}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Logout - revokes all refresh tokens for the user
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user) {
    this.logger.log(
      `🚪 Logout: ${user.accountType} ${user.email} (ID: ${user.userId})`,
    );

    try {
      const result = await this.unifiedAuthService.logout(
        user.userId,
        user.accountType,
      );
      this.logger.log(
        `✅ Logout successful: ${user.accountType} ${user.email} (ID: ${user.userId})`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `❌ Logout failed: ${user.accountType} ${user.email} (ID: ${user.userId})`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get current user/admin profile
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user) {
    this.logger.log(
      `👤 Profile request: ${user.accountType} ${user.email} (ID: ${user.userId})`,
    );

    try {
      const result = await this.unifiedAuthService.getProfile(
        user.userId,
        user.accountType,
      );
      this.logger.log(
        `✅ Profile retrieved: ${user.accountType} ${user.email} (ID: ${user.userId})`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `❌ Profile retrieval failed: ${user.accountType} ${user.email} (ID: ${user.userId})`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Change password for current user/admin
   * Rate limited to 3 attempts per minute per user
   */
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  // Rate limiting handled by RateLimitMiddleware (default: 100 requests per 15 minutes)
  async changePassword(
    @CurrentUser() user,
    @Body() passwordData: ChangePasswordDto,
  ) {
    this.logger.log(
      `🔑 Password change attempt: ${user.accountType} ${user.email} (ID: ${user.userId})`,
    );

    try {
      const result = await this.unifiedAuthService.changePassword(
        user.userId,
        user.accountType,
        passwordData.oldPassword,
        passwordData.newPassword,
      );
      this.logger.log(
        `✅ Password changed: ${user.accountType} ${user.email} (ID: ${user.userId})`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `❌ Password change failed: ${user.accountType} ${user.email} (ID: ${user.userId})`,
        error.stack,
      );
      throw error;
    }
  }
}
