import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { RedisService } from '../infrastructure/redis/redis.service';
import * as bcrypt from 'bcrypt';

export interface AdminLoginDto {
  email: string;
  password: string;
}

export interface AdminRegisterDto {
  name: string;
  email: string;
  password: string;
  role: string;
  authCode: string;
}

export interface AdminJwtPayload {
  sub: number;
  email: string;
  role: string;
  type: 'admin';
}

@Injectable()
export class AdminAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  // Password validation function
  private validatePassword(password: string): void {
    const minLength = 12; // Higher requirement for admin passwords
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      throw new BadRequestException('Admin password must be at least 12 characters long');
    }
    if (!hasUpperCase) {
      throw new BadRequestException('Admin password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
      throw new BadRequestException('Admin password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
      throw new BadRequestException('Admin password must contain at least one number');
    }
    if (!hasSpecialChar) {
      throw new BadRequestException('Admin password must contain at least one special character');
    }
  }

  // Email validation function
  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Invalid email format');
    }
  }

  async validateAdminUser(email: string, password: string): Promise<any> {
    const adminUser = await this.prisma.adminUser.findUnique({
      where: { email },
    });

    if (adminUser && await bcrypt.compare(password, adminUser.password)) {
      const { password, ...result } = adminUser;
      return result;
    }
    return null;
  }

  async adminLogin(loginDto: AdminLoginDto) {
    // Validate email format
    this.validateEmail(loginDto.email);

    const adminUser = await this.validateAdminUser(loginDto.email, loginDto.password);
    
    if (!adminUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!adminUser.isActive) {
      throw new UnauthorizedException('Admin account is deactivated');
    }

    // Update last login
    await this.prisma.adminUser.update({
      where: { id: adminUser.id },
      data: { lastLoginAt: new Date() },
    });

    const payload: AdminJwtPayload = {
      sub: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      type: 'admin',
    };

    // Reduced token expiration for better security
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Store refresh token in Redis with rotation
    await this.redisService.setCache(`admin_refresh:${adminUser.id}`, refreshToken, 7 * 24 * 60 * 60);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      admin: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        permissions: adminUser.permissions,
      },
    };
  }

  async adminRegister(registerDto: AdminRegisterDto) {
    // Validate email format
    this.validateEmail(registerDto.email);
    
    // Validate password complexity
    this.validatePassword(registerDto.password);

    // Validate role
    if (!['admin', 'super_admin'].includes(registerDto.role)) {
      throw new BadRequestException('Invalid admin role');
    }

    // Check if admin already exists
    const existingAdmin = await this.prisma.adminUser.findUnique({
      where: { email: registerDto.email },
    });

    if (existingAdmin) {
      throw new ConflictException('Admin with this email already exists');
    }

    // Hash password with higher salt rounds for better security
    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    const adminUser = await this.prisma.adminUser.create({
      data: {
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
        role: registerDto.role,
      },
    });

    const { password, ...result } = adminUser;
    return result;
  }

  async createUser(adminId: number, userData: {
    name: string;
    email: string;
    password: string;
    company?: string;
    role?: string;
  }) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Create user with admin reference
    const user = await this.prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        company: userData.company,
        role: userData.role || 'user',
        createdByAdminId: adminId,
      },
    });

    const { password, ...result } = user;
    return result;
  }

  async adminLogout(adminId: number) {
    // Remove refresh token from Redis
    await this.redisService.delCache(`admin_refresh:${adminId}`);
    return { message: 'Admin logged out successfully' };
  }

  async getAdminProfile(adminId: number) {
    const adminUser = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
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

    if (!adminUser) {
      throw new UnauthorizedException('Admin user not found');
    }

    return adminUser;
  }

  async updateAdminProfile(adminId: number, profileData: {
    name?: string;
    email?: string;
  }) {
    const adminUser = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
    });

    if (!adminUser) {
      throw new UnauthorizedException('Admin user not found');
    }

    // If email is being updated, check if it's already taken
    if (profileData.email && profileData.email !== adminUser.email) {
      const existingAdmin = await this.prisma.adminUser.findUnique({
        where: { email: profileData.email },
      });

      if (existingAdmin) {
        throw new BadRequestException('Email is already taken');
      }
    }

    // Update admin profile
    const updatedAdmin = await this.prisma.adminUser.update({
      where: { id: adminId },
      data: profileData,
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

    return updatedAdmin;
  }

  async getAllUsers(adminId: number) {
    // Verify admin permissions
    const adminUser = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
    });

    if (!adminUser || !adminUser.isActive) {
      throw new UnauthorizedException('Admin access required');
    }

    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        company: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        createdByAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateUser(adminId: number, userId: number, userData: {
    name?: string;
    email?: string;
    role?: string;
    company?: string;
    isActive?: boolean;
  }) {
    // Verify admin permissions
    const adminUser = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
    });

    if (!adminUser || !adminUser.isActive) {
      throw new UnauthorizedException('Admin access required');
    }

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new UnauthorizedException('User not found');
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
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async deleteUser(adminId: number, userId: number) {
    // Verify admin permissions
    const adminUser = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
    });

    if (!adminUser || !adminUser.isActive) {
      throw new UnauthorizedException('Admin access required');
    }

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new UnauthorizedException('User not found');
    }

    // Delete user (this will cascade to related records)
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'User deleted successfully' };
  }

  async changeAdminPassword(adminId: number, oldPassword: string, newPassword: string) {
    // Validate new password complexity
    this.validatePassword(newPassword);

    const adminUser = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
    });

    if (!adminUser) {
      throw new UnauthorizedException('Admin user not found');
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, adminUser.password);
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check if new password is different from old password
    const isNewPasswordSame = await bcrypt.compare(newPassword, adminUser.password);
    if (isNewPasswordSame) {
      throw new BadRequestException('New password must be different from current password');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await this.prisma.adminUser.update({
      where: { id: adminId },
      data: { password: hashedNewPassword },
    });

    // Invalidate all existing refresh tokens for this admin
    await this.redisService.delCache(`admin_refresh:${adminId}`);

    return { message: 'Admin password changed successfully' };
  }

  async adminRefreshToken(refreshToken: string) {
    try {
      // Decode the refresh token to get admin ID
      const decoded = this.jwtService.verify(refreshToken) as AdminJwtPayload;
      const adminId = decoded.sub;

      // Verify refresh token from Redis
      const storedToken = await this.redisService.getCache(`admin_refresh:${adminId}`);
      
      if (!storedToken || storedToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const adminUser = await this.prisma.adminUser.findUnique({
        where: { id: adminId },
      });

      if (!adminUser || !adminUser.isActive) {
        throw new UnauthorizedException('Admin user not found or inactive');
      }

      const payload: AdminJwtPayload = {
        sub: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        type: 'admin',
      };

      // Generate new tokens with rotation
      const newAccessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
      const newRefreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

      // Update refresh token in Redis (rotation)
      await this.redisService.setCache(`admin_refresh:${adminUser.id}`, newRefreshToken, 7 * 24 * 60 * 60);

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getAllAdminAccounts() {
    return this.prisma.adminUser.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        permissions: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async deleteAdminAccount(adminId: number, targetAdminId: number) {
    // Verify the requesting admin is a super admin
    const requestingAdmin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
    });

    if (!requestingAdmin || requestingAdmin.role !== 'super_admin') {
      throw new UnauthorizedException('Super admin access required');
    }

    // Prevent self-deletion
    if (adminId === targetAdminId) {
      throw new BadRequestException('You cannot delete your own account');
    }

    // Check if target admin exists
    const targetAdmin = await this.prisma.adminUser.findUnique({
      where: { id: targetAdminId },
    });

    if (!targetAdmin) {
      throw new UnauthorizedException('Admin account not found');
    }

    // Get count of users created by this admin
    const usersCreatedByAdmin = await this.prisma.user.count({
      where: { createdByAdminId: targetAdminId },
    });

    // Update all users created by this admin to remove the reference
    if (usersCreatedByAdmin > 0) {
      await this.prisma.user.updateMany({
        where: { createdByAdminId: targetAdminId },
        data: { createdByAdminId: null },
      });
    }

    // Delete the admin account
    await this.prisma.adminUser.delete({
      where: { id: targetAdminId },
    });

    // Invalidate any existing refresh tokens for the deleted admin
    await this.redisService.delCache(`admin_refresh:${targetAdminId}`);

    return { 
      message: `Admin account deleted successfully. ${usersCreatedByAdmin} user(s) created by this admin have been updated to remove the admin reference.` 
    };
  }
} 