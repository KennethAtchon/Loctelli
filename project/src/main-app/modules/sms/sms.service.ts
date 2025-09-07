import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { SmsMessage, SmsCampaign } from '@prisma/client';

export interface MessageHistoryParams {
    page?: number;
    limit?: number;
    status?: string;
    campaignId?: number;
    phoneNumber?: string;
    startDate?: string;
    endDate?: string;
}

export interface SmsStats {
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    totalPending: number;
    monthlyStats: {
        [key: string]: {
            sent: number;
            delivered: number;
            failed: number;
        };
    };
    recentMessages: SmsMessage[];
}

@Injectable()
export class SmsModuleService {
    private readonly logger = new Logger(SmsModuleService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Save SMS message to database
     */
    async saveSmsMessage(
        userId: number,
        subAccountId: number,
        phoneNumber: string,
        message: string,
        status: string,
        twilioSid?: string,
        errorMessage?: string,
        campaignId?: number,
    ): Promise<SmsMessage> {
        return this.prisma.smsMessage.create({
            data: {
                regularUser: {
                    connect: { id: userId }
                },
                subAccount: {
                    connect: { id: subAccountId }
                },
                phoneNumber,
                message,
                status,
                twilioSid,
                errorMessage,
                ...(campaignId && {
                    campaign: {
                        connect: { id: campaignId }
                    }
                }),
                sentAt: status === 'sent' ? new Date() : null,
            },
        });
    }

    /**
     * Update SMS message status
     */
    async updateMessageStatus(
        messageId: number,
        status: string,
        errorMessage?: string,
    ): Promise<SmsMessage> {
        return this.prisma.smsMessage.update({
            where: { id: messageId },
            data: {
                status,
                errorMessage,
                deliveredAt: status === 'delivered' ? new Date() : undefined,
            },
        });
    }

    /**
     * Get SMS message history
     */
    async getMessageHistory(
        userId: number,
        subAccountId: number,
        params: MessageHistoryParams = {},
    ): Promise<{
        messages: SmsMessage[];
        total: number;
        page: number;
        limit: number;
    }> {
        const {
            page = 1,
            limit = 50,
            status,
            campaignId,
            phoneNumber,
            startDate,
            endDate,
        } = params;

        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {
            regularUserId: userId,
            subAccountId,
        };

        if (status) {
            where.status = status;
        }

        if (campaignId) {
            where.campaignId = campaignId;
        }

        if (phoneNumber) {
            where.phoneNumber = {
                contains: phoneNumber,
                mode: 'insensitive',
            };
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate);
            }
        }

        const [messages, total] = await Promise.all([
            this.prisma.smsMessage.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    campaign: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            }),
            this.prisma.smsMessage.count({ where }),
        ]);

        return {
            messages,
            total,
            page,
            limit,
        };
    }

    /**
     * Get SMS statistics
     */
    async getSmsStats(userId: number, subAccountId: number): Promise<SmsStats> {
        // Get message counts by status
        const statusCounts = await this.prisma.smsMessage.groupBy({
            by: ['status'],
            where: { regularUserId: userId, subAccountId },
            _count: { status: true },
        });

        // Get monthly statistics for the last 12 months
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        const monthlyStats = await this.prisma.smsMessage.groupBy({
            by: ['status'],
            where: {
                regularUserId: userId,
                subAccountId,
                createdAt: {
                    gte: twelveMonthsAgo,
                },
            },
            _count: { status: true },
            orderBy: {
                status: 'asc',
            },
        });

        // Get recent messages
        const recentMessages = await this.prisma.smsMessage.findMany({
            where: { regularUserId: userId, subAccountId },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                campaign: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        // Process status counts
        const totalSent = statusCounts.find(s => s.status === 'sent')?._count.status || 0;
        const totalDelivered = statusCounts.find(s => s.status === 'delivered')?._count.status || 0;
        const totalFailed = statusCounts.find(s => s.status === 'failed')?._count.status || 0;
        const totalPending = statusCounts.find(s => s.status === 'pending')?._count.status || 0;

        // Process monthly stats (simplified for now)
        const monthlyStatsProcessed: { [key: string]: { sent: number; delivered: number; failed: number } } = {};

        // This is a simplified version - in a real implementation, you'd want to group by month
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
        monthlyStatsProcessed[currentMonth] = {
            sent: monthlyStats.find(s => s.status === 'sent')?._count.status || 0,
            delivered: monthlyStats.find(s => s.status === 'delivered')?._count.status || 0,
            failed: monthlyStats.find(s => s.status === 'failed')?._count.status || 0,
        };

        return {
            totalSent,
            totalDelivered,
            totalFailed,
            totalPending,
            monthlyStats: monthlyStatsProcessed,
            recentMessages,
        };
    }

    /**
     * Get message by ID
     */
    async getMessage(
        messageId: number,
        userId: number,
        subAccountId: number,
    ): Promise<SmsMessage> {
        const message = await this.prisma.smsMessage.findFirst({
            where: {
                id: messageId,
                regularUserId: userId,
                subAccountId,
            },
            include: {
                campaign: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        return message;
    }

    /**
     * Delete message
     */
    async deleteMessage(
        messageId: number,
        userId: number,
        subAccountId: number,
    ): Promise<void> {
        const message = await this.prisma.smsMessage.findFirst({
            where: {
                id: messageId,
                regularUserId: userId,
                subAccountId,
            },
        });

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        await this.prisma.smsMessage.delete({
            where: { id: messageId },
        });
    }

    /**
     * Export messages to CSV format
     */
    async exportMessages(
        userId: number,
        subAccountId: number,
        params: MessageHistoryParams = {},
    ): Promise<string> {
        const { messages } = await this.getMessageHistory(userId, subAccountId, {
            ...params,
            limit: 10000, // Large limit for export
        });

        // Create CSV header
        const csvHeader = 'Phone Number,Message,Status,Campaign,Sent At,Delivered At,Error Message\n';

        // Create CSV rows
        const csvRows = messages.map(message => {
            const phoneNumber = `"${message.phoneNumber}"`;
            const messageText = `"${message.message.replace(/"/g, '""')}"`;
            const status = message.status;
            const campaign = (message as any).campaign?.name || '';
            const sentAt = message.sentAt ? message.sentAt.toISOString() : '';
            const deliveredAt = message.deliveredAt ? message.deliveredAt.toISOString() : '';
            const errorMessage = message.errorMessage ? `"${message.errorMessage.replace(/"/g, '""')}"` : '';

            return `${phoneNumber},${messageText},${status},"${campaign}",${sentAt},${deliveredAt},${errorMessage}`;
        }).join('\n');

        return csvHeader + csvRows;
    }
}