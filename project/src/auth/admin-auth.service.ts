import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import * as bcrypt from 'bcrypt';

export interface AdminLoginDto {
  email: string;
  password: string;
}

export interface AdminRegisterDto {
  name: string;
  email: string;
  password: string;
  role?: string;
  permissions?: any;
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

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Store refresh token in Redis
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

  async adminRegister(registerDto: AdminRegisterDto & { authCode: string }) {
    // Verify admin auth code
    const validAuthCode = process.env.ADMIN_AUTH_CODE || 'ADMIN_2024_SECURE';
    if (registerDto.authCode !== validAuthCode) {
      throw new UnauthorizedException('Invalid admin authorization code');
    }

    // Check if admin user already exists
    const existingAdmin = await this.prisma.adminUser.findUnique({
      where: { email: registerDto.email },
    });

    if (existingAdmin) {
      throw new ConflictException('Admin user with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    // Create admin user
    const adminUser = await this.prisma.adminUser.create({
      data: {
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
        role: registerDto.role || 'admin',
        permissions: registerDto.permissions,
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

  async adminRefreshToken(adminId: number, refreshToken: string) {
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

    const newAccessToken = this.jwtService.sign(payload);
    const newRefreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Update refresh token in Redis
    await this.redisService.setCache(`admin_refresh:${adminUser.id}`, newRefreshToken, 7 * 24 * 60 * 60);

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
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
        updatedAt: true,
      },
    });

    if (!adminUser) {
      throw new UnauthorizedException('Admin user not found');
    }

    return adminUser;
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
} 