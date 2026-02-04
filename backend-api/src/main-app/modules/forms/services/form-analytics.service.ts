import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

export interface FormAnalytics {
  totalViews: number;
  totalStarted: number;
  totalCompleted: number;
  completionRate: number;
  averageTime: number; // in seconds
  dropOffAnalysis: Array<{
    cardIndex: number;
    cardId: string;
    cardLabel: string;
    views: number;
    dropOffRate: number;
    averageTime: number;
  }>;
  timePerCard: Record<string, number>; // cardId -> average seconds
  deviceBreakdown: {
    mobile: number;
    tablet: number;
    desktop: number;
    unknown: number;
  };
  profileResults?: Array<{
    result: string;
    count: number;
    percentage: number;
  }>;
}

@Injectable()
export class FormAnalyticsService {
  private readonly logger = new Logger(FormAnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get analytics for a form template
   */
  async getFormAnalytics(formTemplateId: string): Promise<FormAnalytics> {
    const template = await this.prisma.formTemplate.findUnique({
      where: { id: formTemplateId },
      include: {
        sessions: true,
        submissions: true,
      },
    });

    if (!template) {
      throw new Error(`Form template ${formTemplateId} not found`);
    }

    const sessions = template.sessions || [];
    const submissions = template.submissions || [];
    const schema = (template.schema as any[]) || [];

    // Calculate metrics
    const totalViews = sessions.length;
    const totalStarted = sessions.filter((s) => s.startedAt).length;
    const totalCompleted = sessions.filter((s) => s.completedAt).length;
    const completionRate =
      totalStarted > 0 ? (totalCompleted / totalStarted) * 100 : 0;

    // Calculate average time
    const completedSessions = sessions.filter((s) => s.completedAt);
    const averageTime =
      completedSessions.length > 0
        ? completedSessions.reduce((sum, s) => {
            const duration =
              s.completedAt && s.startedAt
                ? (s.completedAt.getTime() - s.startedAt.getTime()) / 1000
                : 0;
            return sum + duration;
          }, 0) / completedSessions.length
        : 0;

    // Drop-off analysis
    const dropOffAnalysis = this.calculateDropOffAnalysis(sessions, schema);

    // Time per card
    const timePerCard = this.calculateTimePerCard(sessions, schema);

    // Device breakdown
    const deviceBreakdown = this.calculateDeviceBreakdown(sessions);

    // Profile results distribution (if profile estimation is enabled)
    const profileResults = this.calculateProfileResults(submissions);

    return {
      totalViews,
      totalStarted,
      totalCompleted,
      completionRate: Math.round(completionRate * 10) / 10,
      averageTime: Math.round(averageTime),
      dropOffAnalysis,
      timePerCard,
      deviceBreakdown,
      profileResults,
    };
  }

  /**
   * Calculate drop-off analysis per card
   */
  private calculateDropOffAnalysis(
    sessions: any[],
    schema: any[],
  ): FormAnalytics['dropOffAnalysis'] {
    if (schema.length === 0) return [];

    const analysis = schema.map((field, index) => {
      // Count sessions that reached this card
      const reachedThisCard = sessions.filter(
        (s) => s.currentCardIndex >= index,
      ).length;

      // Count sessions that reached next card (or completed)
      const reachedNextCard =
        index < schema.length - 1
          ? sessions.filter((s) => s.currentCardIndex > index).length
          : sessions.filter((s) => s.completedAt).length;

      const dropOffRate =
        reachedThisCard > 0
          ? ((reachedThisCard - reachedNextCard) / reachedThisCard) * 100
          : 0;

      // Calculate average time on this card
      const timePerCardData = sessions
        .map((s) => {
          const timeData = (s.timePerCard as Record<string, number>) || {};
          return timeData[field.id] || 0;
        })
        .filter((t) => t > 0);

      const averageTime =
        timePerCardData.length > 0
          ? timePerCardData.reduce((sum, t) => sum + t, 0) /
            timePerCardData.length
          : 0;

      return {
        cardIndex: index,
        cardId: field.id,
        cardLabel: field.label || `Card ${index + 1}`,
        views: reachedThisCard,
        dropOffRate: Math.round(dropOffRate * 10) / 10,
        averageTime: Math.round(averageTime),
      };
    });

    return analysis;
  }

  /**
   * Calculate average time per card
   */
  private calculateTimePerCard(
    sessions: any[],
    schema: any[],
  ): Record<string, number> {
    const timePerCard: Record<string, number> = {};

    schema.forEach((field) => {
      const times = sessions
        .map((s) => {
          const timeData = (s.timePerCard as Record<string, number>) || {};
          return timeData[field.id] || 0;
        })
        .filter((t) => t > 0);

      if (times.length > 0) {
        timePerCard[field.id] = Math.round(
          times.reduce((sum, t) => sum + t, 0) / times.length,
        );
      }
    });

    return timePerCard;
  }

  /**
   * Calculate device breakdown
   */
  private calculateDeviceBreakdown(sessions: any[]): {
    mobile: number;
    tablet: number;
    desktop: number;
    unknown: number;
  } {
    const breakdown = {
      mobile: 0,
      tablet: 0,
      desktop: 0,
      unknown: 0,
    };

    sessions.forEach((s) => {
      const deviceType = s.deviceType?.toLowerCase() || 'unknown';
      if (deviceType === 'mobile') {
        breakdown.mobile++;
      } else if (deviceType === 'tablet') {
        breakdown.tablet++;
      } else if (deviceType === 'desktop') {
        breakdown.desktop++;
      } else {
        breakdown.unknown++;
      }
    });

    return breakdown;
  }

  /**
   * Calculate profile results distribution
   */
  private calculateProfileResults(
    submissions: any[],
  ): FormAnalytics['profileResults'] {
    const results: Record<string, number> = {};

    submissions.forEach((submission) => {
      const profileResult = submission.data?.profileResult;
      if (profileResult) {
        const resultKey =
          profileResult.category?.name ||
          profileResult.range ||
          profileResult.type ||
          'Unknown';
        results[resultKey] = (results[resultKey] || 0) + 1;
      }
    });

    const total = Object.values(results).reduce((sum, count) => sum + count, 0);
    if (total === 0) return undefined;

    return Object.entries(results).map(([result, count]) => ({
      result,
      count,
      percentage: Math.round((count / total) * 100 * 10) / 10,
    }));
  }

  /**
   * Track form view
   */
  trackFormView(
    formTemplateId: string,
    deviceInfo?: {
      deviceType?: string;
      browser?: string;
      os?: string;
    },
  ): void {
    try {
      // Create a session to track the view
      // Sessions are created when user starts the form, so this is already handled
      // But we can add a separate view tracking if needed
      this.logger.debug(`Form view tracked for template ${formTemplateId}`);
      return;
    } catch (error) {
      this.logger.error('Failed to track form view', error);
    }
  }

  /**
   * Update time per card for a session
   */
  async updateTimePerCard(
    sessionToken: string,
    cardId: string,
    timeSeconds: number,
  ): Promise<void> {
    try {
      const session = await this.prisma.formSession.findUnique({
        where: { sessionToken },
      });

      if (!session) {
        this.logger.warn(`Session ${sessionToken} not found for time tracking`);
        return;
      }

      const timePerCard = (session.timePerCard as Record<string, number>) || {};
      timePerCard[cardId] = timeSeconds;

      await this.prisma.formSession.update({
        where: { id: session.id },
        data: { timePerCard: timePerCard as any },
      });
    } catch (error) {
      this.logger.error('Failed to update time per card', error);
    }
  }
}
