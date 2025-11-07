import { ToolBuilder, type ToolResult, type ExecutionContext } from '@atchonk/ai-receptionist';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

/**
 * Custom lead management tools for AI-receptionist
 */
@Injectable()
export class LeadManagementTools {
  private readonly logger = new Logger(LeadManagementTools.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create update lead details tool
   */
  createUpdateLeadDetailsTool() {
    return new ToolBuilder()
      .withName('update_lead_details')
      .withDescription(
        'Update lead information in the database. Use when lead provides or corrects their contact details, timezone, company info, or when you learn new information about them.'
      )
      .withParameters({
        type: 'object',
        properties: {
          email: {
            type: 'string',
            description: 'Lead email address',
            format: 'email'
          },
          phone: {
            type: 'string',
            description: 'Lead phone number'
          },
          company: {
            type: 'string',
            description: 'Lead company name'
          },
          position: {
            type: 'string',
            description: 'Lead job title/position'
          },
          timezone: {
            type: 'string',
            description: 'Lead timezone in IANA format (e.g., "America/New_York", "America/Chicago"). Use when lead corrects their timezone.',
            pattern: '^[A-Za-z_]+/[A-Za-z_]+$'
          },
          notes: {
            type: 'string',
            description: 'Additional notes about the lead (append to existing notes, do not replace)'
          }
        }
      })
      .onCall(async (params, ctx: ExecutionContext): Promise<ToolResult> => {
        try {
          // Extract leadId from metadata
          const leadId = ctx.metadata?.leadId as number;
          
          if (!leadId) {
            return {
              success: false,
              error: 'Missing leadId in context',
              response: {
                speak: "I'm sorry, I couldn't find the lead information."
              }
            };
          }

          // Get existing lead
          const lead = await this.prisma.lead.findUnique({
            where: { id: leadId }
          });

          if (!lead) {
            return {
              success: false,
              error: 'Lead not found',
              response: {
                speak: "I couldn't find the lead information. Please try again."
              }
            };
          }

          // Prepare update data
          const updateData: any = {};
          if (params.email) updateData.email = params.email;
          if (params.phone) updateData.phone = params.phone;
          if (params.company) updateData.company = params.company;
          if (params.position) updateData.position = params.position;
          if (params.timezone) updateData.timezone = params.timezone;
          if (params.notes) {
            updateData.notes = lead.notes 
              ? `${lead.notes}\n${params.notes}` 
              : params.notes;
          }

          // Update lead
          await this.prisma.lead.update({
            where: { id: leadId },
            data: updateData
          });

          const updatedFields = Object.keys(updateData).filter(k => k !== 'notes');
          return {
            success: true,
            data: updateData,
            response: {
              speak: `Great! I've updated ${updatedFields.length > 0 ? updatedFields.join(', ') : 'your information'}. Is there anything else I can help you with?`
            }
          };
        } catch (error) {
          this.logger.error('Error updating lead details:', error);
          return {
            success: false,
            error: error.message,
            response: {
              speak: "I'm sorry, I encountered an issue updating your information. Please try again."
            }
          };
        }
      })
      .build();
  }

  /**
   * Create update conversation state tool
   */
  createUpdateConversationStateTool() {
    return new ToolBuilder()
      .withName('update_conversation_state')
      .withDescription(
        'Track important conversation context and sales progress. Use this to remember what you\'ve learned about the lead\'s needs, budget, timeline, objections, and where they are in the sales process. Update this whenever you learn something important.'
      )
      .withParameters({
        type: 'object',
        properties: {
          qualified: {
            type: 'boolean',
            description: 'Set to true once you\'ve confirmed they meet qualification criteria (budget, authority, need, timeline). Set to false if they are disqualified.',
            nullable: true
          },
          budgetDiscussed: {
            type: 'boolean',
            description: 'Set to true when budget has been discussed or confirmed'
          },
          timelineDiscussed: {
            type: 'boolean',
            description: 'Set to true when timeline/urgency has been discussed'
          },
          decisionMaker: {
            type: 'boolean',
            description: 'Set to true if they are the decision maker, false if they need to consult others',
            nullable: true
          },
          painPointsIdentified: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of specific problems or pain points the lead has mentioned (e.g., ["roof leaking", "storm damage", "insurance claim needed"])'
          },
          objections: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of objections raised by the lead (e.g., ["price too high", "need to think about it", "already working with competitor"])'
          },
          stage: {
            type: 'string',
            enum: ['discovery', 'qualification', 'objection_handling', 'closing', 'booked'],
            description: 'Current stage of the sales conversation: discovery (learning needs), qualification (confirming fit), objection_handling (addressing concerns), closing (ready to book), booked (meeting scheduled)'
          }
        }
      })
      .onCall(async (params, ctx: ExecutionContext): Promise<ToolResult> => {
        try {
          // Extract leadId from metadata
          const leadId = ctx.metadata?.leadId as number;
          
          if (!leadId) {
            return {
              success: false,
              error: 'Missing leadId in context',
              response: {
                speak: "I'm sorry, I couldn't find the lead information."
              }
            };
          }

          // Get existing conversation state
          const lead = await this.prisma.lead.findUnique({
            where: { id: leadId },
            select: { conversationState: true }
          });

          if (!lead) {
            return {
              success: false,
              error: 'Lead not found',
              response: {
                speak: "I couldn't find the lead information."
              }
            };
          }

          // Merge with existing state
          const existingState = lead.conversationState 
            ? JSON.parse(lead.conversationState as string) 
            : {};

          const updatedState = {
            ...existingState,
            ...params,
            lastUpdated: new Date().toISOString()
          };

          // Update conversation state
          await this.prisma.lead.update({
            where: { id: leadId },
            data: {
              conversationState: JSON.stringify(updatedState)
            }
          });

          return {
            success: true,
            data: updatedState,
            response: {
              speak: 'Got it! I\'ve noted that information.'
            }
          };
        } catch (error) {
          this.logger.error('Error updating conversation state:', error);
          return {
            success: false,
            error: error.message,
            response: {
              speak: "I'm sorry, I encountered an issue saving that information."
            }
          };
        }
      })
      .build();
  }
}

