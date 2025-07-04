import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService, JwtPayload } from './auth.service';
import { AdminAuthService, AdminJwtPayload } from './admin-auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    private adminAuthService: AdminAuthService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined');
    }
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload | AdminJwtPayload) {
    // Check if this is an admin user
    if ('type' in payload && payload.type === 'admin') {
      return {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
        type: 'admin',
      };
    }
    
    // Regular user
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      type: 'user',
    };
  }
} 