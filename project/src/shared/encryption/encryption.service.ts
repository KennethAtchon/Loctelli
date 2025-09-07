import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly keyLength = 32;
  
  constructor(private configService: ConfigService) {}

  /**
   * Get the encryption key from environment or use a default (should be changed in production)
   * @returns Buffer containing the encryption key
   */
  private getEncryptionKey(): Buffer {
    const secret = this.configService.get<string>('API_KEY_ENCRYPTION_SECRET') || 'default-secret-key-32-characters!!';
    return crypto.scryptSync(secret, 'salt', this.keyLength);
  }

  /**
   * Encrypt sensitive data
   * @param plainText The text to encrypt
   * @returns Encrypted string in format "iv:encryptedData"
   */
  encrypt(plainText: string): string {
    const iv = crypto.randomBytes(16);
    const key = this.getEncryptionKey();
    
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt previously encrypted data
   * @param encryptedText The encrypted text in format "iv:encryptedData"
   * @returns Decrypted plain text
   */
  decrypt(encryptedText: string): string {
    const key = this.getEncryptionKey();
    
    const [ivHex, encrypted] = encryptedText.split(':');
    if (!ivHex || !encrypted) {
      throw new Error('Invalid encrypted text format');
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Check if a string appears to be encrypted (contains colon separator)
   * @param text The text to check
   * @returns True if text appears to be encrypted
   */
  isEncrypted(text: string): boolean {
    return text.includes(':') && text.split(':').length === 2;
  }

  /**
   * Safely encrypt only if not already encrypted
   * @param text The text to encrypt
   * @returns Encrypted text or original if already encrypted
   */
  safeEncrypt(text: string): string {
    return this.isEncrypted(text) ? text : this.encrypt(text);
  }

  /**
   * Safely decrypt only if encrypted
   * @param text The text to decrypt
   * @returns Decrypted text or original if not encrypted
   */
  safeDecrypt(text: string): string {
    return this.isEncrypted(text) ? this.decrypt(text) : text;
  }
}