import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { AccountType } from '../utils/validation.utils';

export class UnifiedLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(['user', 'admin'])
  accountType: AccountType;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

export class UnifiedRegisterDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(['user', 'admin'])
  accountType: AccountType;

  // User-specific fields
  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  budget?: string;

  // Admin-specific fields
  @IsOptional()
  @IsString()
  role?: string; // 'admin' | 'super_admin'

  @IsOptional()
  @IsString()
  authCode?: string; // Required for admin registration
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  oldPassword: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class RefreshTokenDto {
  @IsString()
  refresh_token: string;
}

export interface UnifiedJwtPayload {
  sub: number;              // User ID
  email: string;
  role: string;
  accountType: AccountType;
  subAccountId?: number;    // Only for regular users
  permissions?: any;        // Only for admins
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    company?: string;
    subAccountId?: number;
  };
  admin?: {
    id: number;
    name: string;
    email: string;
    role: string;
    permissions?: any;
  };
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}
