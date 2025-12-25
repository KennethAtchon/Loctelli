import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';

interface ValidatedMessage {
  role: string;
  content: string;
  timestamp: string;
  validationScore: number;
  metadata?: any;
}

interface DecryptedMessage {
  id: string;
  role: string;
  content: string;
  timestamp: string;
  validationScore: number;
  metadata?: any;
}

interface ConversationMetrics {
  messageCount: number;
  averageValidationScore: number;
  riskFlags: string[];
  lastActivity: Date;
}

interface EncryptionResult {
  encryptedContent: string;
  salt: string;
  iv: string;
}

@Injectable()
export class SecureConversationService {
  private readonly logger = new Logger(SecureConversationService.name);
  private readonly encryptionKey: string;
  private readonly algorithm = 'aes-256-cbc';

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Get encryption key from environment or generate a default one
    this.encryptionKey =
      this.configService.get<string>('CONVERSATION_ENCRYPTION_KEY') ||
      this.generateDefaultKey();

    if (!this.configService.get<string>('CONVERSATION_ENCRYPTION_KEY')) {
      this.logger.warn(
        'No CONVERSATION_ENCRYPTION_KEY found in environment. Using generated key. Set CONVERSATION_ENCRYPTION_KEY for production.',
      );
    }
  }

  /**
   * Store a validated message with encryption and integrity protection
   */
  async storeMessage(leadId: number, message: ValidatedMessage): Promise<void> {
    this.logger.debug(`[storeMessage] leadId=${leadId}, role=${message.role}`);

    try {
      // Encrypt the message content
      const encryptionResult = this.encryptContent(message.content);

      // Generate integrity hash for the entire message
      const integrityHash = this.generateIntegrityHash({
        ...message,
        encryptedContent: encryptionResult.encryptedContent,
      });

      // Store in database with encryption
      await this.prisma.conversationMessage.create({
        data: {
          leadId,
          role: message.role,
          encryptedContent: encryptionResult.encryptedContent,
          salt: encryptionResult.salt,
          iv: encryptionResult.iv,
          integrityHash,
          validationScore: message.validationScore,
          messageTimestamp: new Date(message.timestamp),
          metadata: message.metadata ? JSON.stringify(message.metadata) : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      this.logger.debug(
        `[storeMessage] Message stored securely for leadId=${leadId}`,
      );
    } catch (error) {
      this.logger.error(
        `[storeMessage] Failed to store message for leadId=${leadId}:`,
        error,
      );
      throw new Error('Failed to store secure message');
    }
  }

  /**
   * Retrieve and decrypt conversation history for a lead
   */
  async retrieveConversation(
    leadId: number,
    limit?: number,
  ): Promise<DecryptedMessage[]> {
    this.logger.debug(
      `[retrieveConversation] leadId=${leadId}, limit=${limit}`,
    );

    try {
      const messages = await this.prisma.conversationMessage.findMany({
        where: { leadId },
        orderBy: { messageTimestamp: 'asc' },
        take: limit,
      });

      const decryptedMessages: DecryptedMessage[] = [];

      for (const msg of messages) {
        try {
          // Verify integrity first
          const isValid = this.verifyIntegrity(msg);
          if (!isValid) {
            this.logger.warn(
              `[retrieveConversation] Integrity violation detected for message ${msg.id}, leadId=${leadId}`,
            );
            await this.handleIntegrityViolation(msg);
            continue; // Skip corrupted message
          }

          // Decrypt content
          const decryptedContent = this.decryptContent({
            encryptedContent: msg.encryptedContent,
            salt: msg.salt,
            iv: msg.iv,
          });

          decryptedMessages.push({
            id: msg.id,
            role: msg.role,
            content: decryptedContent,
            timestamp: msg.messageTimestamp.toISOString(),
            validationScore: msg.validationScore,
            metadata: msg.metadata ? JSON.parse(msg.metadata) : undefined,
          });
        } catch (error) {
          this.logger.error(
            `[retrieveConversation] Failed to decrypt message ${msg.id}:`,
            error,
          );
          // Continue with other messages
        }
      }

      this.logger.debug(
        `[retrieveConversation] Retrieved ${decryptedMessages.length} messages for leadId=${leadId}`,
      );
      return decryptedMessages;
    } catch (error) {
      this.logger.error(
        `[retrieveConversation] Failed to retrieve conversation for leadId=${leadId}:`,
        error,
      );
      throw new Error('Failed to retrieve secure conversation');
    }
  }

  /**
   * Migrate existing plaintext conversation data to encrypted storage
   */
  async migrateExistingConversations(): Promise<{
    migrated: number;
    failed: number;
  }> {
    this.logger.log(
      '[migrateExistingConversations] Starting migration of existing conversations',
    );

    let migrated = 0;
    let failed = 0;

    try {
      // Find leads with messageHistory but no encrypted messages
      const leadsWithHistory = await this.prisma.lead.findMany({
        where: {
          messageHistory: {
            not: undefined,
          },
        },
        select: {
          id: true,
          messageHistory: true,
        },
      });

      for (const lead of leadsWithHistory) {
        try {
          // Check if already migrated
          const existingMessages = await this.prisma.conversationMessage.count({
            where: { leadId: lead.id },
          });

          if (existingMessages > 0) {
            this.logger.debug(
              `[migrateExistingConversations] Lead ${lead.id} already has encrypted messages, skipping`,
            );
            continue;
          }

          // Parse existing message history
          const messageHistory = JSON.parse(lead.messageHistory as string);

          // Migrate each message
          for (const msg of messageHistory) {
            const validatedMessage: ValidatedMessage = {
              role: msg.role || (msg.from === 'bot' ? 'assistant' : 'user'),
              content: msg.content || msg.message || '',
              timestamp: msg.timestamp || new Date().toISOString(),
              validationScore: 0.5, // Default score for migrated messages
              metadata: { migrated: true, originalFormat: msg },
            };

            await this.storeMessage(lead.id, validatedMessage);
          }

          migrated++;
          this.logger.debug(
            `[migrateExistingConversations] Migrated conversation for lead ${lead.id}`,
          );
        } catch (error) {
          failed++;
          this.logger.error(
            `[migrateExistingConversations] Failed to migrate lead ${lead.id}:`,
            error,
          );
        }
      }

      this.logger.log(
        `[migrateExistingConversations] Migration complete: ${migrated} migrated, ${failed} failed`,
      );
      return { migrated, failed };
    } catch (error) {
      this.logger.error(
        '[migrateExistingConversations] Migration failed:',
        error,
      );
      throw new Error('Migration failed');
    }
  }

  /**
   * Get conversation metrics and security statistics
   */
  async getConversationMetrics(leadId: number): Promise<ConversationMetrics> {
    this.logger.debug(`[getConversationMetrics] leadId=${leadId}`);

    try {
      const messages = await this.prisma.conversationMessage.findMany({
        where: { leadId },
        select: {
          validationScore: true,
          messageTimestamp: true,
          integrityHash: true,
        },
      });

      const messageCount = messages.length;
      const averageValidationScore =
        messageCount > 0
          ? messages.reduce((sum, msg) => sum + msg.validationScore, 0) /
            messageCount
          : 0;

      const riskFlags: string[] = [];

      // Check for risk indicators
      const lowScoreMessages = messages.filter(
        (msg) => msg.validationScore < 0.3,
      ).length;
      if (lowScoreMessages > messageCount * 0.2) {
        riskFlags.push('high_risk_message_ratio');
      }

      const lastActivity =
        messages.length > 0
          ? new Date(
              Math.max(
                ...messages.map((msg) => msg.messageTimestamp.getTime()),
              ),
            )
          : new Date(0);

      return {
        messageCount,
        averageValidationScore,
        riskFlags,
        lastActivity,
      };
    } catch (error) {
      this.logger.error(
        `[getConversationMetrics] Failed to get metrics for leadId=${leadId}:`,
        error,
      );
      throw new Error('Failed to get conversation metrics');
    }
  }

  /**
   * Clean up old conversation data based on retention policy
   */
  async cleanupOldConversations(retentionDays: number = 365): Promise<number> {
    this.logger.log(
      `[cleanupOldConversations] Cleaning up conversations older than ${retentionDays} days`,
    );

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await this.prisma.conversationMessage.deleteMany({
        where: {
          messageTimestamp: {
            lt: cutoffDate,
          },
        },
      });

      this.logger.log(
        `[cleanupOldConversations] Cleaned up ${result.count} old messages`,
      );
      return result.count;
    } catch (error) {
      this.logger.error('[cleanupOldConversations] Cleanup failed:', error);
      throw new Error('Cleanup failed');
    }
  }

  // Private helper methods

  /**
   * Encrypt message content with AES-256-CBC
   */
  private encryptContent(content: string): EncryptionResult {
    const salt = randomBytes(16);
    const iv = randomBytes(16);

    // Derive key using salt
    const key = createHash('sha256')
      .update(this.encryptionKey + salt.toString('hex'))
      .digest();

    const cipher = createCipheriv(this.algorithm, key, iv);
    let encrypted = cipher.update(content, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encryptedContent: encrypted,
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
    };
  }

  /**
   * Decrypt message content
   */
  private decryptContent(data: EncryptionResult): string {
    const salt = Buffer.from(data.salt, 'hex');

    // Derive key using salt
    const key = createHash('sha256')
      .update(this.encryptionKey + salt.toString('hex'))
      .digest();

    const iv = Buffer.from(data.iv, 'hex');
    const decipher = createDecipheriv(this.algorithm, key, iv);
    let decrypted = decipher.update(data.encryptedContent, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generate integrity hash for message verification
   */
  private generateIntegrityHash(messageData: any): string {
    const dataString = JSON.stringify({
      role: messageData.role,
      encryptedContent: messageData.encryptedContent,
      timestamp: messageData.timestamp,
      validationScore: messageData.validationScore,
    });

    return createHash('sha256')
      .update(dataString + this.encryptionKey)
      .digest('hex');
  }

  /**
   * Verify message integrity
   */
  private verifyIntegrity(message: any): boolean {
    try {
      const expectedHash = this.generateIntegrityHash({
        role: message.role,
        encryptedContent: message.encryptedContent,
        timestamp: message.messageTimestamp.toISOString(),
        validationScore: message.validationScore,
      });

      return expectedHash === message.integrityHash;
    } catch (error) {
      this.logger.error('Integrity verification failed:', error);
      return false;
    }
  }

  /**
   * Handle integrity violations
   */
  private async handleIntegrityViolation(message: any): Promise<void> {
    this.logger.error(
      `Integrity violation detected for message ${message.id}, leadId=${message.leadId}`,
    );

    // Log security incident
    try {
      await this.prisma.securityIncident.create({
        data: {
          type: 'INTEGRITY_VIOLATION',
          severity: 'HIGH',
          description: `Message integrity violation detected`,
          leadId: message.leadId,
          messageId: message.id,
          metadata: JSON.stringify({
            messageId: message.id,
            leadId: message.leadId,
            timestamp: new Date().toISOString(),
          }),
          createdAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error('Failed to log security incident:', error);
    }

    // Quarantine the message (mark as corrupted)
    try {
      await this.prisma.conversationMessage.update({
        where: { id: message.id },
        data: {
          metadata: JSON.stringify({
            ...JSON.parse(message.metadata || '{}'),
            corrupted: true,
            corruptionDetected: new Date().toISOString(),
          }),
        },
      });
    } catch (error) {
      this.logger.error('Failed to quarantine corrupted message:', error);
    }
  }

  /**
   * Generate default encryption key for development
   */
  private generateDefaultKey(): string {
    const defaultKey = createHash('sha256')
      .update('loctelli-default-encryption-key-2024')
      .digest('hex');
    return defaultKey;
  }

  /**
   * Export conversation data for backup (encrypted)
   */
  async exportConversationData(leadId: number): Promise<{
    leadId: number;
    messageCount: number;
    exportTimestamp: string;
    encryptedData: string;
  }> {
    this.logger.debug(`[exportConversationData] leadId=${leadId}`);

    try {
      const messages = await this.prisma.conversationMessage.findMany({
        where: { leadId },
        orderBy: { messageTimestamp: 'asc' },
      });

      const exportData = {
        leadId,
        messages: messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          encryptedContent: msg.encryptedContent,
          salt: msg.salt,
          iv: msg.iv,
          integrityHash: msg.integrityHash,
          validationScore: msg.validationScore,
          timestamp: msg.messageTimestamp.toISOString(),
          metadata: msg.metadata,
        })),
        exportTimestamp: new Date().toISOString(),
      };

      // Encrypt the entire export
      const exportEncryption = this.encryptContent(JSON.stringify(exportData));

      return {
        leadId,
        messageCount: messages.length,
        exportTimestamp: exportData.exportTimestamp,
        encryptedData: exportEncryption.encryptedContent,
      };
    } catch (error) {
      this.logger.error(
        `[exportConversationData] Export failed for leadId=${leadId}:`,
        error,
      );
      throw new Error('Export failed');
    }
  }
}
