import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminAuthService, AdminLoginDto, AdminRegisterDto } from './admin-auth.service';
import { AdminAuthCodeService } from './admin-auth-code.service';
import { JwtAuthGuard } from './auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private adminAuthService: AdminAuthService,
    private adminAuthCodeService: AdminAuthCodeService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(@Body() loginDto: AdminLoginDto) {
    return this.adminAuthService.adminLogin(loginDto);
  }

  @Post('register')
  async adminRegister(@Body() registerDto: AdminRegisterDto & { authCode: string }) {
    return this.adminAuthService.adminRegister(registerDto);
  }

  @Post('refresh')
  async adminRefreshToken(@Body() body: { refresh_token: string }) {
    return this.adminAuthService.adminRefreshToken(body.refresh_token);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async adminLogout(@CurrentUser() user) {
    return this.adminAuthService.adminLogout(user.userId);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getAdminProfile(@CurrentUser() user) {
    return this.adminAuthService.getAdminProfile(user.userId);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  async getAllUsers(@CurrentUser() user) {
    return this.adminAuthService.getAllUsers(user.userId);
  }

  @Post('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  async createUser(@CurrentUser() user, @Body() userData: {
    name: string;
    email: string;
    password: string;
    company?: string;
    role?: string;
  }) {
    return this.adminAuthService.createUser(user.userId, userData);
  }

  @Put('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  async updateUser(
    @CurrentUser() user,
    @Param('id', ParseIntPipe) userId: number,
    @Body() userData: {
      name?: string;
      email?: string;
      role?: string;
      company?: string;
      isActive?: boolean;
    }
  ) {
    return this.adminAuthService.updateUser(user.userId, userId, userData);
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  async deleteUser(
    @CurrentUser() user,
    @Param('id', ParseIntPipe) userId: number
  ) {
    return this.adminAuthService.deleteUser(user.userId, userId);
  }

  @Post('generate-auth-code')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  async generateAuthCode(@CurrentUser() user) {
    const authCode = this.adminAuthCodeService.generateAuthCode(20);
    return {
      authCode,
      message: 'Admin authorization code generated successfully',
      expiresIn: 'Never (until changed in environment)',
    };
  }

  @Get('current-auth-code')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  async getCurrentAuthCode(@CurrentUser() user) {
    const authCode = this.adminAuthCodeService.getCurrentAuthCode();
    return {
      authCode,
      message: 'Current admin authorization code',
    };
  }
} 