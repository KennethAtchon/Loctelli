import { BadRequestException } from '@nestjs/common';

export type AccountType = 'user' | 'admin';

export class AuthValidation {
  /**
   * Validate email format
   * @param email Email address to validate
   * @throws BadRequestException if email format is invalid
   */
  static validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      throw new BadRequestException('Invalid email format');
    }
  }

  /**
   * Validate password strength based on account type
   * @param password Password to validate
   * @param accountType Type of account ('user' | 'admin')
   * @throws BadRequestException if password doesn't meet requirements
   */
  static validatePassword(password: string, accountType: AccountType): void {
    const requirements = this.getPasswordRequirements(accountType);

    // Check minimum length
    if (password.length < requirements.minLength) {
      throw new BadRequestException(
        `Password must be at least ${requirements.minLength} characters long`
      );
    }

    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one uppercase letter');
    }

    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one lowercase letter');
    }

    // Check for number
    if (!/\d/.test(password)) {
      throw new BadRequestException('Password must contain at least one number');
    }

    // Check for special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new BadRequestException('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)');
    }
  }

  /**
   * Get password requirements for account type
   */
  static getPasswordRequirements(accountType: AccountType) {
    return accountType === 'admin'
      ? {
          minLength: 12,
          description: 'Admin passwords require at least 12 characters, including uppercase, lowercase, number, and special character',
        }
      : {
          minLength: 8,
          description: 'Passwords require at least 8 characters, including uppercase, lowercase, number, and special character',
        };
  }

  /**
   * Validate account type
   * @param accountType Account type to validate
   * @throws BadRequestException if account type is invalid
   */
  static validateAccountType(accountType: string): accountType is AccountType {
    if (accountType !== 'user' && accountType !== 'admin') {
      throw new BadRequestException('Invalid account type. Must be "user" or "admin"');
    }
    return true;
  }
}
