import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PromptSecurityService {
  private readonly logger = new Logger(PromptSecurityService.name);

  // Jailbreak detection patterns
  private readonly jailbreakPatterns = [
    // Direct role manipulation attempts
    /ignore\s+(all\s+)?previous\s+instructions?/gi,
    /forget\s+(all\s+)?previous\s+instructions?/gi,
    /act\s+as\s+(?!.*sales|.*customer|.*assistant)/gi,
    /you\s+are\s+now\s+(?!.*sales|.*customer|.*assistant)/gi,
    /pretend\s+to\s+be\s+(?!.*sales|.*customer|.*assistant)/gi,
    /roleplay\s+as\s+(?!.*sales|.*customer|.*assistant)/gi,
    /system\s*[:]\s*ignore/gi,
    /override\s+system\s+prompt/gi,
    
    // Instruction injection attempts  
    /new\s+instructions?\s*[:]/gi,
    /updated\s+instructions?\s*[:]/gi,
    /developer\s+mode/gi,
    /admin\s+mode/gi,
    /debug\s+mode/gi,
    /maintenance\s+mode/gi,
    
    // Prompt boundary attempts
    /```\s*system/gi,
    /\[SYSTEM\]/gi,
    /\[\/SYSTEM\]/gi,
    /<system>/gi,
    /<\/system>/gi,
    
    // Context poisoning
    /end\s+of\s+conversation/gi,
    /conversation\s+complete/gi,
    /session\s+terminated/gi,
    
    // Information extraction attempts
    /what\s+(is|are)\s+your\s+instructions?/gi,
    /show\s+me\s+your\s+prompt/gi,
    /what\s+is\s+your\s+system\s+message/gi,
    /repeat\s+your\s+instructions/gi,
    /print\s+your\s+prompt/gi,
    
    // Encoding bypass attempts
    /[b][a][s][e][6][4]/gi,
    /&#x[0-9a-f]+;/gi,
    /\\u[0-9a-f]{4}/gi,
    
    // Direct harmful content requests
    /how\s+to\s+(hack|exploit|attack)/gi,
    /generate\s+(malware|virus|exploit)/gi,
  ];

  // Character limit enforcement
  private readonly MAX_MESSAGE_LENGTH = 2000;
  private readonly MAX_MESSAGES_PER_MINUTE = 10;
  
  // Rate limiting storage (in production, use Redis)
  private readonly rateLimitStore = new Map<string, { count: number; resetTime: number }>();

  /**
   * Analyze user input for jailbreak attempts
   * @param content User message content
   * @param leadId Lead identifier for logging
   * @returns Security analysis result
   */
  analyzeInput(content: string, leadId: number): {
    isSecure: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    detectedPatterns: string[];
    sanitizedContent: string;
  } {
    const detectedPatterns: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Check for jailbreak patterns
    for (const pattern of this.jailbreakPatterns) {
      if (pattern.test(content)) {
        const match = content.match(pattern);
        if (match) {
          detectedPatterns.push(match[0]);
          riskLevel = 'high';
          this.logger.warn(`Jailbreak attempt detected for leadId=${leadId}: ${match[0]}`);
        }
      }
    }

    // Check message length
    if (content.length > this.MAX_MESSAGE_LENGTH) {
      detectedPatterns.push('excessive_length');
      riskLevel = riskLevel === 'high' ? 'high' : 'medium';
      this.logger.warn(`Excessive message length for leadId=${leadId}: ${content.length} chars`);
    }

    // Check for suspicious character patterns
    const suspiciousChars = this.detectSuspiciousChars(content);
    if (suspiciousChars.length > 0) {
      detectedPatterns.push(...suspiciousChars);
      riskLevel = riskLevel === 'high' ? 'high' : 'medium';
    }

    // Sanitize content
    const sanitizedContent = this.sanitizeContent(content);

    return {
      isSecure: riskLevel === 'low' && detectedPatterns.length === 0,
      riskLevel,
      detectedPatterns,
      sanitizedContent
    };
  }

  /**
   * Check rate limiting for a lead
   * @param leadId Lead identifier
   * @returns True if within rate limits
   */
  checkRateLimit(leadId: number): boolean {
    const now = Date.now();
    const key = `lead_${leadId}`;
    const limit = this.rateLimitStore.get(key);

    if (!limit || now > limit.resetTime) {
      // Reset or initialize
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + 60000 // 1 minute
      });
      return true;
    }

    if (limit.count >= this.MAX_MESSAGES_PER_MINUTE) {
      this.logger.warn(`Rate limit exceeded for leadId=${leadId}`);
      return false;
    }

    limit.count++;
    return true;
  }

  /**
   * Detect suspicious character patterns
   * @param content Message content
   * @returns Array of detected suspicious patterns
   */
  private detectSuspiciousChars(content: string): string[] {
    const patterns: string[] = [];

    // High Unicode usage (potential encoding attacks)
    const unicodeMatches = content.match(/\\u[0-9a-f]{4}/gi);
    if (unicodeMatches && unicodeMatches.length > 3) {
      patterns.push('excessive_unicode');
    }

    // HTML entities (potential XSS attempts)
    const htmlEntities = content.match(/&#?\w+;/gi);
    if (htmlEntities && htmlEntities.length > 2) {
      patterns.push('html_entities');
    }

    // Base64-like patterns
    const base64Pattern = /[A-Za-z0-9+/]{20,}={0,2}/g;
    if (base64Pattern.test(content)) {
      patterns.push('base64_pattern');
    }

    // Excessive special characters
    const specialCharCount = (content.match(/[^a-zA-Z0-9\s.,!?]/g) || []).length;
    if (specialCharCount > content.length * 0.3) {
      patterns.push('excessive_special_chars');
    }

    return patterns;
  }

  /**
   * Sanitize user content
   * @param content Raw user input
   * @returns Sanitized content
   */
  private sanitizeContent(content: string): string {
    let sanitized = content;

    // Remove potential injection markers
    sanitized = sanitized.replace(/```[^`]*```/g, '[code block removed]');
    sanitized = sanitized.replace(/<[^>]*>/g, ''); // Remove HTML tags
    sanitized = sanitized.replace(/\[SYSTEM\].*?\[\/SYSTEM\]/gi, '');
    sanitized = sanitized.replace(/\{system\}.*?\{\/system\}/gi, '');
    
    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    // Truncate if too long
    if (sanitized.length > this.MAX_MESSAGE_LENGTH) {
      sanitized = sanitized.substring(0, this.MAX_MESSAGE_LENGTH) + '...';
    }

    return sanitized;
  }

  /**
   * Generate secure response when jailbreak detected
   * @param riskLevel Detected risk level
   * @returns Appropriate response message
   */
  generateSecurityResponse(riskLevel: 'medium' | 'high'): string {
    const responses = {
      medium: [
        "I'm here to help you with information about our services. How can I assist you today?",
        "Let's focus on how we can help meet your business needs. What would you like to know?",
        "I'd be happy to discuss our solutions with you. What specific area interests you?"
      ],
      high: [
        "I'm designed to help customers learn about our services. Is there something specific I can help you with?",
        "Let's keep our conversation focused on how we can serve your business needs.",
        "I'm here to provide information about our company and services. How may I help you?"
      ]
    };

    const responseArray = responses[riskLevel];
    return responseArray[Math.floor(Math.random() * responseArray.length)];
  }

  /**
   * Log security incidents for monitoring
   * @param leadId Lead identifier
   * @param riskLevel Risk level
   * @param detectedPatterns Detected attack patterns
   * @param originalMessage Original user message
   */
  logSecurityIncident(
    leadId: number, 
    riskLevel: 'medium' | 'high', 
    detectedPatterns: string[], 
    originalMessage: string
  ): void {
    const logData = {
      leadId,
      riskLevel,
      detectedPatterns,
      messageLength: originalMessage.length,
      timestamp: new Date().toISOString(),
      // Don't log full message content for privacy, just a hash
      messageHash: this.hashString(originalMessage)
    };

    this.logger.warn(`Security incident detected: ${JSON.stringify(logData)}`);
  }

  /**
   * Simple hash function for logging purposes
   * @param str String to hash
   * @returns Simple hash
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }
}