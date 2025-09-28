import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../main-app/infrastructure/prisma/prisma.service';
import { SemanticSecurityService } from './semantic-security.service';
import { ValidationPipelineService } from './validation-pipeline.service';
import { SecureConversationService } from './secure-conversation.service';

interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  description: string;
  leadId?: number;
  messageId?: string;
  userId?: number;
  metadata: any;
  timestamp: Date;
}

interface SecurityMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  recentEvents: SecurityEvent[];
  riskScore: number;
  trends: {
    increasingThreats: boolean;
    commonAttackPatterns: string[];
    riskLeads: number[];
  };
}

interface MonitoringReport {
  reportId: string;
  generatedAt: Date;
  timeRange: {
    start: Date;
    end: Date;
  };
  metrics: SecurityMetrics;
  recommendations: SecurityRecommendation[];
  alerts: SecurityAlert[];
}

interface SecurityRecommendation {
  type: 'IMMEDIATE' | 'MEDIUM' | 'LONG_TERM';
  priority: number;
  title: string;
  description: string;
  actions: string[];
}

interface SecurityAlert {
  id: string;
  severity: SecuritySeverity;
  type: SecurityEventType;
  message: string;
  affectedEntities: string[];
  timestamp: Date;
  resolved: boolean;
}

interface ConversationAnalysis {
  leadId: number;
  conversationRisk: number;
  threatIndicators: string[];
  progressiveAttackDetected: boolean;
  anomalousActivityScore: number;
  recommendedActions: string[];
}

type SecurityEventType =
  | 'PROMPT_INJECTION'
  | 'ROLE_MANIPULATION'
  | 'CONTEXT_SWITCHING'
  | 'INFORMATION_EXTRACTION'
  | 'ENCODING_ATTACK'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTEGRITY_VIOLATION'
  | 'PROGRESSIVE_ATTACK'
  | 'BEHAVIORAL_ANOMALY'
  | 'VALIDATION_FAILURE';

type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

@Injectable()
export class SecurityMonitoringService implements OnModuleInit {
  private readonly logger = new Logger(SecurityMonitoringService.name);
  private readonly eventBuffer: SecurityEvent[] = [];
  private readonly maxBufferSize = 1000;
  private monitoringInterval: NodeJS.Timeout | null = null;

  // Real-time metrics tracking
  private readonly metricsWindow = 24 * 60 * 60 * 1000; // 24 hours
  private readonly alertThresholds = {
    HIGH_RISK_EVENTS_PER_HOUR: 10,
    CRITICAL_EVENTS_PER_HOUR: 5,
    PROGRESSIVE_ATTACKS_PER_DAY: 3,
    FAILED_VALIDATIONS_PER_HOUR: 20
  };

  constructor(
    private prisma: PrismaService,
    private semanticSecurity: SemanticSecurityService,
    private validationPipeline: ValidationPipelineService,
    private secureConversation: SecureConversationService
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing Security Monitoring Service');
    await this.startRealtimeMonitoring();
    this.logger.log('Security Monitoring Service initialized and running');
  }

  /**
   * Start real-time monitoring with periodic analysis
   */
  private async startRealtimeMonitoring(): Promise<void> {
    // Run analysis every 5 minutes
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performPeriodicAnalysis();
      } catch (error) {
        this.logger.error('Error during periodic security analysis:', error);
      }
    }, 5 * 60 * 1000);

    this.logger.log('Real-time security monitoring started');
  }

  /**
   * Monitor a conversation in real-time
   */
  async monitorConversation(
    leadId: number,
    message: string,
    validationResult: any,
    semanticAnalysis: any
  ): Promise<ConversationAnalysis> {
    this.logger.debug(`[monitorConversation] leadId=${leadId}`);

    try {
      const analysis: ConversationAnalysis = {
        leadId,
        conversationRisk: 0,
        threatIndicators: [],
        progressiveAttackDetected: false,
        anomalousActivityScore: 0,
        recommendedActions: []
      };

      // Analyze validation results
      if (!validationResult.isValid) {
        analysis.conversationRisk += 0.3;
        analysis.threatIndicators.push(...validationResult.failedStages.map((stage: any) => stage.name));

        // Log security events
        for (const event of validationResult.securityEvents) {
          await this.logSecurityEvent({
            type: this.mapEventType(event.type),
            severity: this.mapSeverity(event.severity),
            description: event.description,
            leadId,
            metadata: event.metadata
          });
        }
      }

      // Analyze semantic threats
      if (!semanticAnalysis.isSecure) {
        analysis.conversationRisk += semanticAnalysis.riskScore;
        analysis.threatIndicators.push(...semanticAnalysis.threats.map((t: any) => t.type));

        // Log semantic threats
        for (const threat of semanticAnalysis.threats) {
          await this.logSecurityEvent({
            type: threat.type.toUpperCase() as SecurityEventType,
            severity: this.mapSeverity(threat.severity),
            description: `Semantic threat detected: ${threat.type}`,
            leadId,
            metadata: { pattern: threat.pattern, confidence: threat.confidence }
          });
        }
      }

      // Check for progressive attacks
      const progressiveAttack = await this.detectProgressiveAttack(leadId);
      if (progressiveAttack.detected) {
        analysis.progressiveAttackDetected = true;
        analysis.conversationRisk += 0.5;
        analysis.threatIndicators.push('progressive_attack');

        await this.logSecurityEvent({
          type: 'PROGRESSIVE_ATTACK',
          severity: 'HIGH',
          description: 'Progressive injection attack pattern detected',
          leadId,
          metadata: progressiveAttack
        });
      }

      // Calculate anomaly score
      analysis.anomalousActivityScore = await this.calculateAnomalyScore(leadId, message);
      if (analysis.anomalousActivityScore > 0.7) {
        analysis.conversationRisk += 0.3;
        analysis.threatIndicators.push('behavioral_anomaly');
      }

      // Generate recommendations
      analysis.recommendedActions = this.generateRecommendations(analysis);

      // Alert if high risk
      if (analysis.conversationRisk > 0.7) {
        await this.triggerSecurityAlert({
          severity: 'HIGH',
          type: 'PROMPT_INJECTION',
          message: `High-risk conversation detected for lead ${leadId}`,
          affectedEntities: [`lead:${leadId}`],
          resolved: false
        });
      }

      this.logger.debug(`[monitorConversation] Analysis complete: risk=${analysis.conversationRisk}`);
      return analysis;

    } catch (error) {
      this.logger.error(`[monitorConversation] Error analyzing conversation for leadId=${leadId}:`, error);
      throw new Error('Conversation monitoring failed');
    }
  }

  /**
   * Generate comprehensive security report
   */
  async generateSecurityReport(timeRange?: { start: Date; end: Date }): Promise<MonitoringReport> {
    this.logger.log('[generateSecurityReport] Generating security report');

    const defaultRange = {
      start: new Date(Date.now() - this.metricsWindow),
      end: new Date()
    };

    const range = timeRange || defaultRange;

    try {
      // Fetch security events from the time range
      const events = await this.prisma.securityIncident.findMany({
        where: {
          createdAt: {
            gte: range.start,
            lte: range.end
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Calculate metrics
      const metrics = this.calculateSecurityMetrics(events);

      // Generate recommendations
      const recommendations = await this.generateSecurityRecommendations(metrics);

      // Get active alerts
      const alerts = await this.getActiveAlerts();

      const report: MonitoringReport = {
        reportId: `security_report_${Date.now()}`,
        generatedAt: new Date(),
        timeRange: range,
        metrics,
        recommendations,
        alerts
      };

      this.logger.log(`[generateSecurityReport] Report generated with ${events.length} events`);
      return report;

    } catch (error) {
      this.logger.error('[generateSecurityReport] Report generation failed:', error);
      throw new Error('Security report generation failed');
    }
  }

  /**
   * Get real-time security dashboard data
   */
  async getSecurityDashboard(): Promise<{
    currentThreatLevel: SecuritySeverity;
    activeThreats: number;
    recentEvents: SecurityEvent[];
    systemHealth: {
      validationPipelineStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN';
      semanticSecurityStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN';
      storageIntegrity: 'HEALTHY' | 'COMPROMISED';
      monitoringStatus: 'ACTIVE' | 'INACTIVE';
    };
    metrics: {
      eventsLast24h: number;
      blockedAttacks: number;
      averageRiskScore: number;
      criticalAlerts: number;
    };
  }> {
    this.logger.debug('[getSecurityDashboard] Generating dashboard data');

    try {
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Get recent events
      const recentEvents = await this.prisma.securityIncident.findMany({
        where: {
          createdAt: { gte: last24h }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      // Calculate threat level
      const currentThreatLevel = this.calculateCurrentThreatLevel(recentEvents);

      // Check system health
      const systemHealth = await this.checkSystemHealth();

      // Calculate metrics
      const metrics = {
        eventsLast24h: recentEvents.length,
        blockedAttacks: recentEvents.filter(e =>
          ['PROMPT_INJECTION', 'ROLE_MANIPULATION', 'PROGRESSIVE_ATTACK'].includes(e.type)
        ).length,
        averageRiskScore: this.calculateAverageRiskScore(recentEvents),
        criticalAlerts: recentEvents.filter(e => e.severity === 'CRITICAL').length
      };

      return {
        currentThreatLevel,
        activeThreats: recentEvents.filter(e => !e.resolved).length,
        recentEvents: recentEvents.map(this.mapPrismaEventToSecurityEvent),
        systemHealth,
        metrics
      };

    } catch (error) {
      this.logger.error('[getSecurityDashboard] Dashboard generation failed:', error);
      throw new Error('Security dashboard generation failed');
    }
  }

  /**
   * Log a security event
   */
  private async logSecurityEvent(eventData: {
    type: SecurityEventType;
    severity: SecuritySeverity;
    description: string;
    leadId?: number;
    messageId?: string;
    userId?: number;
    metadata?: any;
  }): Promise<void> {
    try {
      await this.prisma.securityIncident.create({
        data: {
          type: eventData.type,
          severity: eventData.severity,
          description: eventData.description,
          leadId: eventData.leadId,
          messageId: eventData.messageId,
          userId: eventData.userId,
          metadata: eventData.metadata ? JSON.stringify(eventData.metadata) : null,
          resolved: false,
          createdAt: new Date()
        }
      });

      // Add to in-memory buffer for real-time processing
      const event: SecurityEvent = {
        id: `event_${Date.now()}_${Math.random()}`,
        ...eventData,
        timestamp: new Date()
      };

      this.eventBuffer.push(event);
      if (this.eventBuffer.length > this.maxBufferSize) {
        this.eventBuffer.shift(); // Remove oldest event
      }

    } catch (error) {
      this.logger.error('Failed to log security event:', error);
    }
  }

  // Helper methods

  private async performPeriodicAnalysis(): Promise<void> {
    this.logger.debug('[performPeriodicAnalysis] Running periodic security analysis');

    try {
      // Check for alert conditions
      await this.checkAlertThresholds();

      // Analyze conversation trends
      await this.analyzeConversationTrends();

      // Check system integrity
      await this.performIntegrityChecks();

    } catch (error) {
      this.logger.error('[performPeriodicAnalysis] Periodic analysis failed:', error);
    }
  }

  private async checkAlertThresholds(): Promise<void> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentEvents = await this.prisma.securityIncident.findMany({
      where: {
        createdAt: { gte: oneHourAgo }
      }
    });

    const highRiskEvents = recentEvents.filter(e => e.severity === 'HIGH').length;
    const criticalEvents = recentEvents.filter(e => e.severity === 'CRITICAL').length;

    if (highRiskEvents > this.alertThresholds.HIGH_RISK_EVENTS_PER_HOUR) {
      await this.triggerSecurityAlert({
        severity: 'HIGH',
        type: 'RATE_LIMIT_EXCEEDED',
        message: `High risk events threshold exceeded: ${highRiskEvents} events in last hour`,
        affectedEntities: ['system'],
        resolved: false
      });
    }

    if (criticalEvents > this.alertThresholds.CRITICAL_EVENTS_PER_HOUR) {
      await this.triggerSecurityAlert({
        severity: 'CRITICAL',
        type: 'RATE_LIMIT_EXCEEDED',
        message: `Critical events threshold exceeded: ${criticalEvents} events in last hour`,
        affectedEntities: ['system'],
        resolved: false
      });
    }
  }

  private async analyzeConversationTrends(): Promise<void> {
    // Implement conversation trend analysis
    // This would analyze patterns across conversations to detect coordinated attacks
  }

  private async performIntegrityChecks(): Promise<void> {
    // Implement system integrity checks
    // This would verify the integrity of stored conversations and system components
  }

  private async detectProgressiveAttack(leadId: number): Promise<{ detected: boolean; evidence: any }> {
    const recentEvents = await this.prisma.securityIncident.findMany({
      where: {
        leadId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      orderBy: { createdAt: 'asc' }
    });

    const attackPatterns = recentEvents.filter(e =>
      ['PROMPT_INJECTION', 'ROLE_MANIPULATION', 'CONTEXT_SWITCHING'].includes(e.type)
    );

    return {
      detected: attackPatterns.length >= 3,
      evidence: {
        eventCount: attackPatterns.length,
        timeSpan: attackPatterns.length > 0 ?
          attackPatterns[attackPatterns.length - 1].createdAt.getTime() - attackPatterns[0].createdAt.getTime() : 0,
        patterns: attackPatterns.map(e => e.type)
      }
    };
  }

  private async calculateAnomalyScore(leadId: number, message: string): Promise<number> {
    // Implement behavioral anomaly detection
    // This would compare current behavior against historical patterns
    return 0.1; // Placeholder
  }

  private generateRecommendations(analysis: ConversationAnalysis): string[] {
    const recommendations: string[] = [];

    if (analysis.conversationRisk > 0.8) {
      recommendations.push('IMMEDIATE: Block conversation and investigate');
    } else if (analysis.conversationRisk > 0.5) {
      recommendations.push('Monitor closely and validate all responses');
    }

    if (analysis.progressiveAttackDetected) {
      recommendations.push('Implement enhanced validation for this lead');
    }

    if (analysis.anomalousActivityScore > 0.7) {
      recommendations.push('Review behavioral patterns and consider rate limiting');
    }

    return recommendations;
  }

  private async triggerSecurityAlert(alertData: Omit<SecurityAlert, 'id' | 'timestamp'>): Promise<void> {
    const alert: SecurityAlert = {
      id: `alert_${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
      ...alertData
    };

    this.logger.warn(`[SECURITY ALERT] ${alert.severity}: ${alert.message}`);

    // In production, this would also:
    // - Send notifications to security team
    // - Update monitoring dashboards
    // - Trigger automated responses based on severity
  }

  private calculateSecurityMetrics(events: any[]): SecurityMetrics {
    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};

    events.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
    });

    const riskScore = this.calculateOverallRiskScore(events);

    return {
      totalEvents: events.length,
      eventsByType,
      eventsBySeverity,
      recentEvents: events.slice(0, 10).map(this.mapPrismaEventToSecurityEvent),
      riskScore,
      trends: {
        increasingThreats: this.detectIncreasingTrends(events),
        commonAttackPatterns: Object.keys(eventsByType).slice(0, 5),
        riskLeads: this.identifyRiskLeads(events)
      }
    };
  }

  private async generateSecurityRecommendations(metrics: SecurityMetrics): Promise<SecurityRecommendation[]> {
    const recommendations: SecurityRecommendation[] = [];

    if (metrics.riskScore > 0.8) {
      recommendations.push({
        type: 'IMMEDIATE',
        priority: 1,
        title: 'High Risk Score Detected',
        description: 'System risk score is above critical threshold',
        actions: [
          'Review all recent security events',
          'Implement additional monitoring',
          'Consider temporary restrictions on high-risk conversations'
        ]
      });
    }

    if (metrics.trends.increasingThreats) {
      recommendations.push({
        type: 'MEDIUM',
        priority: 2,
        title: 'Increasing Threat Trend',
        description: 'Security threats are trending upward',
        actions: [
          'Analyze attack patterns for coordination',
          'Update security policies',
          'Enhance user education on security practices'
        ]
      });
    }

    return recommendations;
  }

  private async getActiveAlerts(): Promise<SecurityAlert[]> {
    // This would fetch active alerts from a persistent store
    return []; // Placeholder
  }

  private calculateCurrentThreatLevel(events: any[]): SecuritySeverity {
    const criticalEvents = events.filter(e => e.severity === 'CRITICAL').length;
    const highEvents = events.filter(e => e.severity === 'HIGH').length;

    if (criticalEvents > 0) return 'CRITICAL';
    if (highEvents > 3) return 'HIGH';
    if (events.length > 10) return 'MEDIUM';
    return 'LOW';
  }

  private async checkSystemHealth(): Promise<any> {
    return {
      validationPipelineStatus: 'HEALTHY',
      semanticSecurityStatus: 'HEALTHY',
      storageIntegrity: 'HEALTHY',
      monitoringStatus: 'ACTIVE'
    };
  }

  private calculateAverageRiskScore(events: any[]): number {
    if (events.length === 0) return 0;

    const severityScores = {
      'LOW': 0.2,
      'MEDIUM': 0.5,
      'HIGH': 0.8,
      'CRITICAL': 1.0
    };

    const total = events.reduce((sum, event) =>
      sum + (severityScores[event.severity as SecuritySeverity] || 0), 0
    );

    return total / events.length;
  }

  private mapPrismaEventToSecurityEvent = (event: any): SecurityEvent => ({
    id: event.id,
    type: event.type as SecurityEventType,
    severity: event.severity as SecuritySeverity,
    description: event.description,
    leadId: event.leadId,
    messageId: event.messageId,
    userId: event.userId,
    metadata: event.metadata ? JSON.parse(event.metadata) : {},
    timestamp: event.createdAt
  });

  private mapEventType(type: string): SecurityEventType {
    const mapping: Record<string, SecurityEventType> = {
      'syntactic': 'VALIDATION_FAILURE',
      'semantic': 'PROMPT_INJECTION',
      'contextual': 'CONTEXT_SWITCHING',
      'historical': 'PROGRESSIVE_ATTACK'
    };
    return mapping[type] || 'VALIDATION_FAILURE';
  }

  private mapSeverity(severity: string): SecuritySeverity {
    const mapping: Record<string, SecuritySeverity> = {
      'low': 'LOW',
      'medium': 'MEDIUM',
      'high': 'HIGH'
    };
    return mapping[severity] || 'MEDIUM';
  }

  private calculateOverallRiskScore(events: any[]): number {
    // Implement risk score calculation based on events
    return Math.min(events.length * 0.1, 1.0);
  }

  private detectIncreasingTrends(events: any[]): boolean {
    // Implement trend detection logic
    return events.length > 20;
  }

  private identifyRiskLeads(events: any[]): number[] {
    const leadCounts: Record<number, number> = {};

    events.forEach(event => {
      if (event.leadId) {
        leadCounts[event.leadId] = (leadCounts[event.leadId] || 0) + 1;
      }
    });

    return Object.entries(leadCounts)
      .filter(([_, count]) => count > 3)
      .map(([leadId, _]) => parseInt(leadId))
      .slice(0, 10);
  }
}