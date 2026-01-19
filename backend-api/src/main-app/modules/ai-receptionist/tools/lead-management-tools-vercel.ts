import { tool } from 'ai';
import { z } from 'zod';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

/**
 * Lead management tools for Vercel AI SDK
 * Config-based approach: leadId is passed in closure
 */
@Injectable()
export class LeadManagementToolsVercel {
  private readonly logger = new Logger(LeadManagementToolsVercel.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create update lead details tool for Vercel AI SDK
   * @param leadId Lead ID (from closure)
   */
  createUpdateLeadDetailsTool(leadId: number) {
    return tool({
      description:
        'Update lead information in the database. Use when lead provides or corrects their contact details, timezone, company info, or when you learn new information about them.',
      parameters: z.object({
        email: z.string().email().optional().describe('Lead email address'),
        phone: z.string().optional().describe('Lead phone number'),
        company: z.string().optional().describe('Lead company name'),
        position: z.string().optional().describe('Lead job title/position'),
        timezone: z
          .string()
          .regex(/^[A-Za-z_]+\/[A-Za-z_]+$/, 'Invalid IANA timezone format')
          .optional()
          .describe(
            'Lead timezone in IANA format (e.g., "America/New_York", "America/Chicago"). Use when lead corrects their timezone.',
          ),
        notes: z
          .string()
          .optional()
          .describe(
            'Additional notes about the lead (append to existing notes, do not replace)',
          ),
      }),
      // @ts-expect-error - TypeScript type inference issue with 'ai' package tool function execute property
      execute: async ({ email, phone, company, position, timezone, notes }) => {
        try {
          // Get existing lead
          const lead = await this.prisma.lead.findUnique({
            where: { id: leadId },
          });

          if (!lead) {
            return "I couldn't find the lead information. Please try again.";
          }

          // Prepare update data
          const updateData: any = {};
          if (email) updateData.email = email;
          if (phone) updateData.phone = phone;
          if (company) updateData.company = company;
          if (position) updateData.position = position;
          if (timezone) updateData.timezone = timezone;
          if (notes) {
            updateData.notes = lead.notes ? `${lead.notes}\n${notes}` : notes;
          }

          // Update lead
          await this.prisma.lead.update({
            where: { id: leadId },
            data: updateData,
          });

          const updatedFields = Object.keys(updateData).filter(
            (k) => k !== 'notes',
          );
          return `Great! I've updated ${updatedFields.length > 0 ? updatedFields.join(', ') : 'your information'}. Is there anything else I can help you with?`;
        } catch (error) {
          this.logger.error('Error updating lead details:', error);
          return "I'm sorry, I encountered an issue updating your information. Please try again.";
        }
      },
    });
  }

  /**
   * Create update conversation state tool for Vercel AI SDK
   * @param leadId Lead ID (from closure)
   */
  createUpdateConversationStateTool(leadId: number) {
    return tool({
      description:
        "Track important conversation context and sales progress. Use this to remember what you've learned about the lead's needs, budget, timeline, objections, and where they are in the sales process. Update this whenever you learn something important.",
      parameters: z.object({
        qualified: z
          .boolean()
          .nullable()
          .optional()
          .describe(
            "Set to true once you've confirmed they meet qualification criteria (budget, authority, need, timeline). Set to false if they are disqualified.",
          ),
        budgetDiscussed: z
          .boolean()
          .optional()
          .describe('Set to true when budget has been discussed or confirmed'),
        timelineDiscussed: z
          .boolean()
          .optional()
          .describe('Set to true when timeline/urgency has been discussed'),
        decisionMaker: z
          .boolean()
          .nullable()
          .optional()
          .describe(
            'Set to true if they are the decision maker, false if they need to consult others',
          ),
        painPointsIdentified: z
          .array(z.string())
          .optional()
          .describe(
            'List of specific problems or pain points the lead has mentioned (e.g., ["roof leaking", "storm damage", "insurance claim needed"])',
          ),
        objections: z
          .array(z.string())
          .optional()
          .describe(
            'List of objections raised by the lead (e.g., ["price too high", "need to think about it", "already working with competitor"])',
          ),
        stage: z
          .enum([
            'discovery',
            'qualification',
            'objection_handling',
            'closing',
            'booked',
          ])
          .optional()
          .describe(
            'Current stage of the sales conversation: discovery (learning needs), qualification (confirming fit), objection_handling (addressing concerns), closing (ready to book), booked (meeting scheduled)',
          ),
      }),
      // @ts-expect-error - TypeScript type inference issue with 'ai' package tool function execute property
      execute: async (params) => {
        try {
          // Get existing conversation state
          const lead = await this.prisma.lead.findUnique({
            where: { id: leadId },
            select: { conversationState: true },
          });

          if (!lead) {
            return "I couldn't find the lead information.";
          }

          // Merge with existing state
          const existingState = lead.conversationState
            ? JSON.parse(lead.conversationState as string)
            : {};

          const updatedState = {
            ...existingState,
            ...params,
            lastUpdated: new Date().toISOString(),
          };

          // Update conversation state
          await this.prisma.lead.update({
            where: { id: leadId },
            data: {
              conversationState: JSON.stringify(updatedState),
            },
          });

          return "Got it! I've noted that information.";
        } catch (error) {
          this.logger.error('Error updating conversation state:', error);
          return "I'm sorry, I encountered an issue saving that information.";
        }
      },
    });
  }
}
