import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UnifiedJwtPayload } from '../dto/unified-auth.dto';
import { SystemUserService } from '../services/system-user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private systemUserService: SystemUserService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request) => {
          // Check for x-user-token header
          const userToken =
            request?.headers?.['x-user-token'] ||
            request?.headers?.['X-User-Token'];
          if (userToken) {
            this.logger.debug(
              `Extracted token from x-user-token header: ${userToken.substring(0, 20)}...`,
            );
          }
          return userToken;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });

    this.logger.log('JWT Strategy initialized');
  }

  validate(payload: UnifiedJwtPayload) {
    this.logger.debug(
      `Validating JWT payload: ${JSON.stringify({
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        accountType: payload.accountType,
      })}`,
    );

    try {
      // Check if this is an admin user
      if (payload.accountType === 'admin') {
        this.logger.debug(
          `Admin user validation for ID: ${payload.sub}, email: ${payload.email}`,
        );

        // For admin users, we include both their admin ID and the system user ID
        // This allows services to use the system user ID for user-specific operations
        return {
          userId: payload.sub, // Admin's real ID
          systemUserId: this.systemUserService.getSystemUserId(), // System user ID for operations
          email: payload.email,
          role: payload.role,
          accountType: 'admin',
          permissions: payload.permissions,
        };
      }

      // Regular user
      this.logger.debug(
        `Regular user validation for ID: ${payload.sub}, email: ${payload.email}`,
      );
      return {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
        accountType: 'user',
        subAccountId: payload.subAccountId,
      };
    } catch (error) {
      this.logger.error(
        `JWT validation failed for payload: ${JSON.stringify(payload)}`,
        error.stack,
      );
      throw error;
    }
  }
}
