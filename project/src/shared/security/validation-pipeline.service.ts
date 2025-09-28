import { Injectable, Logger } from '@nestjs/common';
import { SemanticSecurityService } from './semantic-security.service';
import { PromptSecurityService } from './prompt-security.service';

interface ValidationResult {
  isValid: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  sanitizedInput: string;
  failedStages: ValidationStage[];
  securityEvents: SecurityEvent[];
  metadata: ValidationMetadata;
}

interface ValidationStage {
  name: string;
  passed: boolean;
  riskScore: number;
  issues: string[];
  processingTime: number;
}

interface SecurityEvent {
  type: 'syntactic' | 'semantic' | 'contextual' | 'historical' | 'rate_limit';
  severity: 'low' | 'medium' | 'high';
  description: string;
  timestamp: Date;
  metadata: any;
}

interface ValidationMetadata {
  totalProcessingTime: number;
  stagesExecuted: number;
  cacheHits: number;
  originalLength: number;
  sanitizedLength: number;
}

interface ConversationContext {
  leadId: number;
  userId: number;
  messageHistory: any[];
  conversationAge: number; // in minutes
  messageCount: number;
  lastMessageTime?: Date;
}

@Injectable()
export class ValidationPipelineService {
  private readonly logger = new Logger(ValidationPipelineService.name);

  // Historical validation storage (in production, use Redis)
  private readonly conversationPatterns = new Map<number, ConversationPattern>();
  private readonly userBehaviorProfile = new Map<number, UserBehaviorProfile>();

  constructor(
    private semanticSecurity: SemanticSecurityService,
    private promptSecurity: PromptSecurityService
  ) {}

  /**
   * Main validation pipeline entry point
   */
  async validateInput(
    input: string,
    context: ConversationContext
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    const stages: ValidationStage[] = [];
    const securityEvents: SecurityEvent[] = [];
    let sanitizedInput = input;
    let overallRiskLevel: 'low' | 'medium' | 'high' = 'low';

    this.logger.debug(`[validateInput] Starting validation for leadId=${context.leadId}`);

    try {
      // Stage 1: Syntactic Validation
      const syntacticResult = await this.syntacticValidation(input);
      stages.push(syntacticResult.stage);
      if (syntacticResult.events.length > 0) {
        securityEvents.push(...syntacticResult.events);
      }
      if (!syntacticResult.stage.passed) {
        return this.buildFailureResult(stages, securityEvents, input, startTime);
      }
      sanitizedInput = syntacticResult.sanitizedContent;
      overallRiskLevel = this.updateRiskLevel(overallRiskLevel, syntacticResult.stage.riskScore);

      // Stage 2: Legacy Pattern Detection (for compatibility)
      const legacyResult = await this.legacyPatternValidation(sanitizedInput, context.leadId);
      stages.push(legacyResult.stage);
      if (legacyResult.events.length > 0) {
        securityEvents.push(...legacyResult.events);
      }
      if (!legacyResult.stage.passed) {
        return this.buildFailureResult(stages, securityEvents, sanitizedInput, startTime);
      }
      overallRiskLevel = this.updateRiskLevel(overallRiskLevel, legacyResult.stage.riskScore);

      // Stage 3: Semantic Validation
      const semanticResult = await this.semanticValidation(sanitizedInput, context.leadId);
      stages.push(semanticResult.stage);
      if (semanticResult.events.length > 0) {
        securityEvents.push(...semanticResult.events);
      }
      if (!semanticResult.stage.passed) {
        return this.buildFailureResult(stages, securityEvents, sanitizedInput, startTime);
      }
      sanitizedInput = semanticResult.sanitizedContent;
      overallRiskLevel = this.updateRiskLevel(overallRiskLevel, semanticResult.stage.riskScore);

      // Stage 4: Contextual Validation
      const contextualResult = await this.contextualValidation(sanitizedInput, context);
      stages.push(contextualResult.stage);
      if (contextualResult.events.length > 0) {
        securityEvents.push(...contextualResult.events);
      }
      if (!contextualResult.stage.passed) {
        return this.buildFailureResult(stages, securityEvents, sanitizedInput, startTime);
      }
      overallRiskLevel = this.updateRiskLevel(overallRiskLevel, contextualResult.stage.riskScore);

      // Stage 5: Historical Validation
      const historicalResult = await this.historicalValidation(sanitizedInput, context);
      stages.push(historicalResult.stage);
      if (historicalResult.events.length > 0) {
        securityEvents.push(...historicalResult.events);
      }
      if (!historicalResult.stage.passed) {
        return this.buildFailureResult(stages, securityEvents, sanitizedInput, startTime);
      }
      overallRiskLevel = this.updateRiskLevel(overallRiskLevel, historicalResult.stage.riskScore);

      // All stages passed
      const totalTime = Date.now() - startTime;
      this.updateUserBehaviorProfile(context.leadId, 'legitimate');

      return {
        isValid: true,
        riskLevel: overallRiskLevel,
        sanitizedInput,
        failedStages: [],
        securityEvents,
        metadata: {
          totalProcessingTime: totalTime,
          stagesExecuted: stages.length,
          cacheHits: 0, // TODO: implement cache hit tracking
          originalLength: input.length,
          sanitizedLength: sanitizedInput.length
        }
      };

    } catch (error) {
      this.logger.error('Error in validation pipeline:', error);
      return this.buildErrorResult(stages, securityEvents, input, startTime);
    }
  }

  /**
   * Stage 1: Syntactic validation for format, encoding, and basic patterns
   */
  private async syntacticValidation(input: string): Promise<{
    stage: ValidationStage;
    events: SecurityEvent[];
    sanitizedContent: string;
  }> {
    const stageStart = Date.now();
    const issues: string[] = [];
    const events: SecurityEvent[] = [];
    let sanitized = input;

    // Length validation
    const MAX_LENGTH = 5000;
    if (input.length > MAX_LENGTH) {
      issues.push(`Message exceeds maximum length (${input.length} > ${MAX_LENGTH})`);
      sanitized = input.substring(0, MAX_LENGTH) + '...';
      events.push({
        type: 'syntactic',
        severity: 'medium',
        description: 'Message length exceeded limits',
        timestamp: new Date(),
        metadata: { originalLength: input.length, truncatedLength: MAX_LENGTH }
      });
    }

    // Character encoding validation
    const suspiciousEncodingPatterns = [
      { pattern: /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, name: 'control_characters' },
      { pattern: /[\uFEFF\u200B-\u200D\u2060]/g, name: 'zero_width_characters' },
      { pattern: /%[0-9a-fA-F]{2}/g, name: 'url_encoding', threshold: 5 }
    ];

    for (const { pattern, name, threshold = 1 } of suspiciousEncodingPatterns) {
      const matches = sanitized.match(pattern);
      if (matches && matches.length >= threshold) {
        issues.push(`Suspicious ${name} detected (${matches.length} instances)`);
        sanitized = sanitized.replace(pattern, '');
        events.push({
          type: 'syntactic',
          severity: 'medium',
          description: `Suspicious encoding pattern: ${name}`,
          timestamp: new Date(),
          metadata: { pattern: name, count: matches.length }
        });
      }
    }

    // Repetitive pattern detection
    const repetitivePattern = /(.{1,50})\1{5,}/g;
    if (repetitivePattern.test(sanitized)) {
      issues.push('Repetitive patterns detected');
      sanitized = sanitized.replace(repetitivePattern, '$1...[pattern repeated]');
      events.push({
        type: 'syntactic',
        severity: 'low',
        description: 'Repetitive patterns detected and cleaned',
        timestamp: new Date(),
        metadata: {}
      });
    }

    // Basic structure validation
    const structuralIssues = this.validateStructure(sanitized);
    issues.push(...structuralIssues.map(s => s.description));

    const processingTime = Date.now() - stageStart;
    const riskScore = this.calculateStageRiskScore(issues, events);

    return {
      stage: {
        name: 'syntactic_validation',
        passed: issues.length === 0 || !issues.some(i => i.includes('exceeds maximum')),
        riskScore,
        issues,
        processingTime
      },
      events,
      sanitizedContent: sanitized
    };
  }

  /**
   * Stage 2: Legacy pattern validation (compatibility with existing PromptSecurityService)
   */
  private async legacyPatternValidation(input: string, leadId: number): Promise<{
    stage: ValidationStage;
    events: SecurityEvent[];
  }> {
    const stageStart = Date.now();
    const events: SecurityEvent[] = [];

    // Use existing prompt security service
    const legacyAnalysis = this.promptSecurity.analyzeInput(input, leadId);
    const issues: string[] = [];

    if (!legacyAnalysis.isSecure) {
      issues.push(...legacyAnalysis.detectedPatterns.map(p => `Legacy pattern detected: ${p}`));

      events.push({
        type: 'syntactic',
        severity: legacyAnalysis.riskLevel as 'low' | 'medium' | 'high',
        description: 'Legacy security patterns detected',
        timestamp: new Date(),
        metadata: {
          patterns: legacyAnalysis.detectedPatterns,
          riskLevel: legacyAnalysis.riskLevel
        }
      });
    }

    const processingTime = Date.now() - stageStart;
    const riskScore = legacyAnalysis.riskLevel === 'high' ? 0.9 :
                     legacyAnalysis.riskLevel === 'medium' ? 0.6 : 0.2;

    return {
      stage: {
        name: 'legacy_pattern_validation',
        passed: legacyAnalysis.isSecure,
        riskScore,
        issues,
        processingTime
      },
      events
    };
  }

  /**
   * Stage 3: Semantic validation using AI embeddings
   */
  private async semanticValidation(input: string, leadId: number): Promise<{
    stage: ValidationStage;
    events: SecurityEvent[];
    sanitizedContent: string;
  }> {
    const stageStart = Date.now();
    const events: SecurityEvent[] = [];

    const semanticAnalysis = await this.semanticSecurity.analyzeInput(input, leadId);
    const issues: string[] = [];

    if (!semanticAnalysis.isSecure) {
      issues.push(`Semantic threats detected: ${semanticAnalysis.threats.map(t => t.type).join(', ')}`);

      for (const threat of semanticAnalysis.threats) {
        events.push({
          type: 'semantic',
          severity: threat.severity,
          description: `Semantic threat: ${threat.type}`,
          timestamp: new Date(),
          metadata: {
            threatType: threat.type,
            confidence: threat.confidence,
            pattern: threat.pattern
          }
        });
      }
    }

    const processingTime = Date.now() - stageStart;

    return {
      stage: {
        name: 'semantic_validation',
        passed: semanticAnalysis.isSecure,
        riskScore: semanticAnalysis.riskScore,
        issues,
        processingTime
      },
      events,
      sanitizedContent: semanticAnalysis.sanitizedContent
    };
  }

  /**
   * Stage 4: Contextual validation based on conversation context
   */
  private async contextualValidation(input: string, context: ConversationContext): Promise<{
    stage: ValidationStage;
    events: SecurityEvent[];
  }> {
    const stageStart = Date.now();
    const issues: string[] = [];
    const events: SecurityEvent[] = [];

    // Check conversation context appropriateness
    const contextualIssues = this.analyzeConversationalContext(input, context);
    issues.push(...contextualIssues.map(c => c.description));

    // Check for context switching attempts
    const contextSwitching = this.detectContextSwitching(input, context);
    if (contextSwitching.detected) {
      issues.push('Context switching attempt detected');
      events.push({
        type: 'contextual',
        severity: 'medium',
        description: 'Context switching attempt',
        timestamp: new Date(),
        metadata: contextSwitching
      });
    }

    // Validate conversation flow continuity
    const flowIssues = this.validateConversationFlow(input, context);
    issues.push(...flowIssues);

    const processingTime = Date.now() - stageStart;
    const riskScore = this.calculateStageRiskScore(issues, events);

    return {
      stage: {
        name: 'contextual_validation',
        passed: issues.length === 0,
        riskScore,
        issues,
        processingTime
      },
      events
    };
  }

  /**
   * Stage 5: Historical validation across conversation history
   */
  private async historicalValidation(input: string, context: ConversationContext): Promise<{
    stage: ValidationStage;
    events: SecurityEvent[];
  }> {
    const stageStart = Date.now();
    const issues: string[] = [];
    const events: SecurityEvent[] = [];

    // Update conversation pattern tracking
    this.updateConversationPattern(context.leadId, input);

    // Check for progressive injection attempts
    const progressiveAttack = this.detectProgressiveAttack(context.leadId, input);
    if (progressiveAttack.detected) {
      issues.push('Progressive injection attack detected');
      events.push({
        type: 'historical',
        severity: 'high',
        description: 'Progressive injection attack pattern',
        timestamp: new Date(),
        metadata: progressiveAttack
      });
    }

    // Check behavioral anomalies
    const behaviorAnomaly = this.detectBehaviorAnomaly(context.leadId, input, context);
    if (behaviorAnomaly.detected) {
      issues.push('Behavioral anomaly detected');
      events.push({
        type: 'historical',
        severity: behaviorAnomaly.severity,
        description: 'Behavioral pattern anomaly',
        timestamp: new Date(),
        metadata: behaviorAnomaly
      });
    }

    const processingTime = Date.now() - stageStart;
    const riskScore = this.calculateStageRiskScore(issues, events);

    return {
      stage: {
        name: 'historical_validation',
        passed: issues.length === 0,
        riskScore,
        issues,
        processingTime
      },
      events
    };
  }

  // Helper methods for validation stages

  private validateStructure(input: string): Array<{description: string}> {
    const issues: Array<{description: string}> = [];

    // Check for excessive nested structures
    const nestedBrackets = (input.match(/\[|\{|\(/g) || []).length;
    const closingBrackets = (input.match(/\]|\}|\)/g) || []).length;

    if (nestedBrackets > 10) {
      issues.push({description: 'Excessive nested structures detected'});
    }

    if (Math.abs(nestedBrackets - closingBrackets) > 2) {
      issues.push({description: 'Unbalanced bracket structures'});
    }

    return issues;
  }

  private analyzeConversationalContext(input: string, context: ConversationContext): Array<{description: string}> {
    const issues: Array<{description: string}> = [];

    // Check for topic appropriateness
    const salesKeywords = ['business', 'service', 'product', 'solution', 'help', 'need', 'interested'];
    const offTopicKeywords = ['weather', 'politics', 'personal', 'unrelated'];

    const inputLower = input.toLowerCase();
    const hasRelevantKeywords = salesKeywords.some(keyword => inputLower.includes(keyword));
    const hasOffTopicKeywords = offTopicKeywords.some(keyword => inputLower.includes(keyword));

    if (context.messageCount > 5 && !hasRelevantKeywords && hasOffTopicKeywords) {
      issues.push({description: 'Message appears off-topic for sales conversation'});
    }

    return issues;
  }

  private detectContextSwitching(input: string, context: ConversationContext): {detected: boolean; confidence: number; indicators: string[]} {
    const indicators: string[] = [];
    const switchingPatterns = [
      /let's change the topic/i,
      /speaking of something else/i,
      /by the way/i,
      /completely different question/i,
      /random question/i
    ];

    for (const pattern of switchingPatterns) {
      if (pattern.test(input)) {
        indicators.push(pattern.source);
      }
    }

    return {
      detected: indicators.length > 0,
      confidence: Math.min(indicators.length * 0.3, 1.0),
      indicators
    };
  }

  private validateConversationFlow(input: string, context: ConversationContext): string[] {
    const issues: string[] = [];

    // Check for sudden conversation direction changes
    if (context.messageHistory.length > 0) {
      const lastMessage = context.messageHistory[context.messageHistory.length - 1];
      if (lastMessage && this.isAbruptTopicChange(lastMessage.content || lastMessage.message || '', input)) {
        issues.push('Abrupt conversation topic change detected');
      }
    }

    return issues;
  }

  private isAbruptTopicChange(lastMessage: string, currentMessage: string): boolean {
    // Simple heuristic - in production, this could use semantic similarity
    const lastWords = lastMessage.toLowerCase().split(/\s+/).slice(-5);
    const currentWords = currentMessage.toLowerCase().split(/\s+/).slice(0, 5);

    const commonWords = lastWords.filter(word => currentWords.includes(word));
    return commonWords.length === 0 && currentMessage.length > 50;
  }

  // Historical pattern tracking methods

  private updateConversationPattern(leadId: number, input: string): void {
    const existing = this.conversationPatterns.get(leadId) || {
      messageCount: 0,
      suspiciousPatterns: [],
      lastUpdated: new Date(),
      riskScore: 0
    };

    existing.messageCount++;
    existing.lastUpdated = new Date();

    // Track suspicious patterns over time
    const suspiciousIndicators = this.extractSuspiciousIndicators(input);
    existing.suspiciousPatterns.push(...suspiciousIndicators);

    // Keep only recent patterns (last 50 messages)
    if (existing.suspiciousPatterns.length > 50) {
      existing.suspiciousPatterns = existing.suspiciousPatterns.slice(-50);
    }

    this.conversationPatterns.set(leadId, existing);
  }

  private extractSuspiciousIndicators(input: string): string[] {
    const indicators: string[] = [];

    const suspiciousPatterns = [
      /ignore/i, /override/i, /system/i, /prompt/i, /instruction/i,
      /forget/i, /pretend/i, /role/i, /character/i, /mode/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(input)) {
        indicators.push(pattern.source);
      }
    }

    return indicators;
  }

  private detectProgressiveAttack(leadId: number, currentInput: string): {detected: boolean; confidence: number; evidence: any} {
    const pattern = this.conversationPatterns.get(leadId);
    if (!pattern) return {detected: false, confidence: 0, evidence: null};

    // Look for escalating suspicious patterns
    const recentPatterns = pattern.suspiciousPatterns.slice(-10);
    const uniquePatterns = new Set(recentPatterns);

    // Progressive attack indicators
    const isEscalating = uniquePatterns.size >= 3;
    const hasRecentActivity = recentPatterns.length >= 5;
    const currentSuspicious = this.extractSuspiciousIndicators(currentInput).length > 0;

    const detected = isEscalating && hasRecentActivity && currentSuspicious;
    const confidence = detected ? Math.min((uniquePatterns.size / 5) * 0.8, 0.9) : 0;

    return {
      detected,
      confidence,
      evidence: {
        uniquePatterns: Array.from(uniquePatterns),
        recentPatternCount: recentPatterns.length,
        escalationScore: uniquePatterns.size
      }
    };
  }

  private updateUserBehaviorProfile(leadId: number, classification: 'legitimate' | 'suspicious' | 'malicious'): void {
    const existing = this.userBehaviorProfile.get(leadId) || {
      totalMessages: 0,
      legitimateCount: 0,
      suspiciousCount: 0,
      maliciousCount: 0,
      firstSeen: new Date(),
      lastSeen: new Date(),
      riskScore: 0
    };

    existing.totalMessages++;
    existing.lastSeen = new Date();

    switch (classification) {
      case 'legitimate':
        existing.legitimateCount++;
        break;
      case 'suspicious':
        existing.suspiciousCount++;
        break;
      case 'malicious':
        existing.maliciousCount++;
        break;
    }

    // Calculate updated risk score
    existing.riskScore = (existing.suspiciousCount * 0.5 + existing.maliciousCount) / existing.totalMessages;

    this.userBehaviorProfile.set(leadId, existing);
  }

  private detectBehaviorAnomaly(leadId: number, input: string, context: ConversationContext): {detected: boolean; severity: 'low' | 'medium' | 'high'; evidence: any} {
    const profile = this.userBehaviorProfile.get(leadId);
    if (!profile || profile.totalMessages < 5) {
      return {detected: false, severity: 'low', evidence: null};
    }

    const anomalies: string[] = [];

    // Check for sudden message length changes
    const avgLength = this.calculateAverageMessageLength(context.messageHistory);
    if (input.length > avgLength * 3) {
      anomalies.push('sudden_length_increase');
    }

    // Check for behavior pattern changes
    if (profile.riskScore < 0.1 && this.extractSuspiciousIndicators(input).length > 2) {
      anomalies.push('sudden_suspicious_behavior');
    }

    const detected = anomalies.length > 0;
    const severity = anomalies.includes('sudden_suspicious_behavior') ? 'high' :
                    anomalies.length > 1 ? 'medium' : 'low';

    return {
      detected,
      severity,
      evidence: {
        anomalies,
        profileRiskScore: profile.riskScore,
        messageLength: input.length,
        averageLength: avgLength
      }
    };
  }

  private calculateAverageMessageLength(history: any[]): number {
    if (history.length === 0) return 100; // Default

    const totalLength = history.reduce((sum, msg) => {
      const content = msg.content || msg.message || '';
      return sum + content.length;
    }, 0);

    return totalLength / history.length;
  }

  // Utility methods

  private calculateStageRiskScore(issues: string[], events: SecurityEvent[]): number {
    if (issues.length === 0 && events.length === 0) return 0;

    let score = issues.length * 0.2;

    for (const event of events) {
      switch (event.severity) {
        case 'high':
          score += 0.4;
          break;
        case 'medium':
          score += 0.3;
          break;
        case 'low':
          score += 0.1;
          break;
      }
    }

    return Math.min(score, 1.0);
  }

  private updateRiskLevel(current: 'low' | 'medium' | 'high', stageScore: number): 'low' | 'medium' | 'high' {
    const stageLevel = stageScore >= 0.7 ? 'high' : stageScore >= 0.4 ? 'medium' : 'low';

    if (current === 'high' || stageLevel === 'high') return 'high';
    if (current === 'medium' || stageLevel === 'medium') return 'medium';
    return 'low';
  }

  private buildFailureResult(stages: ValidationStage[], events: SecurityEvent[], input: string, startTime: number): ValidationResult {
    return {
      isValid: false,
      riskLevel: 'high',
      sanitizedInput: input,
      failedStages: stages.filter(s => !s.passed),
      securityEvents: events,
      metadata: {
        totalProcessingTime: Date.now() - startTime,
        stagesExecuted: stages.length,
        cacheHits: 0,
        originalLength: input.length,
        sanitizedLength: input.length
      }
    };
  }

  private buildErrorResult(stages: ValidationStage[], events: SecurityEvent[], input: string, startTime: number): ValidationResult {
    return {
      isValid: false,
      riskLevel: 'high',
      sanitizedInput: input,
      failedStages: stages,
      securityEvents: events,
      metadata: {
        totalProcessingTime: Date.now() - startTime,
        stagesExecuted: stages.length,
        cacheHits: 0,
        originalLength: input.length,
        sanitizedLength: input.length
      }
    };
  }
}

// Supporting interfaces
interface ConversationPattern {
  messageCount: number;
  suspiciousPatterns: string[];
  lastUpdated: Date;
  riskScore: number;
}

interface UserBehaviorProfile {
  totalMessages: number;
  legitimateCount: number;
  suspiciousCount: number;
  maliciousCount: number;
  firstSeen: Date;
  lastSeen: Date;
  riskScore: number;
}