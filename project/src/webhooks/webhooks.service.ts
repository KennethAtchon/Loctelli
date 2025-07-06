import { Injectable, Logger, HttpStatus, HttpException } from '@nestjs/common';
import { WebhookEventDto } from './dto/webhook-event.dto';
import { ContactCreatedDto } from './dto/contact-created.dto';
import { OutboundMessageDto } from './dto/outbound-message.dto';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  
  constructor(private prisma: PrismaService) {}

  async handleWebhook(webhookEventDto: WebhookEventDto) {
    const { type, source, payload, signature } = webhookEventDto;
    
    this.logger.log(`Received webhook: ${type} from ${source}`);
    
    // Verify webhook signature if provided
    if (signature) {
      this.verifySignature(payload, signature);
    }
    
    // Process webhook based on type and source
    switch (type) {
      case 'booking.created':
        return this.handleBookingCreated(payload);
      case 'booking.updated':
        return this.handleBookingUpdated(payload);
      case 'lead.created':
        return this.handleLeadCreated(payload);
      case 'lead.updated':
        return this.handleLeadUpdated(payload);
      case 'contact.created':
        return this.handleContactCreated(payload);
      case 'outbound.message':
        return this.handleOutboundMessage(payload);
      default:
        this.logger.warn(`Unhandled webhook type: ${type}`);
        return { status: 'unhandled', message: `Webhook type ${type} not implemented` };
    }
  }

  private verifySignature(payload: any, signature: string): boolean {
    // In a real implementation, this would verify the signature using a shared secret
    // For now, we'll just log and return true
    this.logger.log('Verifying webhook signature');
    return true;
  }

  private async handleBookingCreated(payload: any) {
    this.logger.log('Processing booking.created webhook');
    // Implementation would depend on the specific payload structure
    // For example, creating a booking record in the database
    return { status: 'processed', type: 'booking.created' };
  }

  private async handleBookingUpdated(payload: any) {
    this.logger.log('Processing booking.updated webhook');
    // Implementation would depend on the specific payload structure
    return { status: 'processed', type: 'booking.updated' };
  }

  private async handleLeadCreated(payload: any) {
    this.logger.log('Processing lead.created webhook');
    // Implementation would depend on the specific payload structure
    return { status: 'processed', type: 'lead.created' };
  }

  private async handleLeadUpdated(payload: any) {
    this.logger.log('Processing lead.updated webhook');
    // Implementation would depend on the specific payload structure
    return { status: 'processed', type: 'lead.updated' };
  }

  /**
   * Handle HighLevel Contact Created Webhook
   * Docs: https://highlevel.stoplight.io/docs/integrations/4974a1cf9b56d-contact
   */
  private async handleContactCreated(payload: any) {
    this.logger.log('Processing contact.created webhook');
    
    try {
      const contactData = payload as ContactCreatedDto;
      
      // Find user by locationId or default to user_id=1 if not found
      const user = await this.prisma.user.findFirst({
        where: { locationId: contactData.locationId }
      });
      const userId = user?.id || 1;
      
      if (!user) {
        throw new HttpException(
          { status: 'error', message: `No user found with locationId ${contactData.locationId}` },
          HttpStatus.NOT_FOUND
        );
      }
      
      // Get the first strategy for this user
      const strategy = await this.prisma.strategy.findFirst({
        where: { userId }
      });
      const strategyId = strategy?.id || 1;
      
      // Create a new Lead with the found user_id and their first strategy
      const name = contactData.name || 
        ((contactData.firstName && contactData.lastName) ? 
          `${contactData.firstName} ${contactData.lastName}` : 
          contactData.firstName || contactData.lastName || 'Unknown');
      
      const lead = await this.prisma.lead.create({
        data: {
          userId,
          strategyId,
          name,
          customId: contactData.id,
          messageHistory: [],
          status: 'lead',
          subAccountId: user.subAccountId
        }
      });
      
      return {
        status: 'lead_created',
        lead: {
          id: lead.id,
          userId: lead.userId,
          strategyId: lead.strategyId,
          name: lead.name,
          customId: lead.customId,
          status: lead.status
        }
      };
    } catch (error) {
      this.logger.error(`Error processing contact.created webhook: ${error.message}`);
      throw new HttpException(
        { status: 'error', message: error.message, data: payload },
        HttpStatus.BAD_REQUEST
      );
    }
  }
  
  /**
   * Handle HighLevel Outbound Message Webhook
   * Handles outbound message events (SMS, Call, Voicemail, Email, etc.)
   */
  private async handleOutboundMessage(payload: any) {
    this.logger.log('Processing outbound.message webhook');
    
    try {
      const messageData = payload as OutboundMessageDto;
      
      // Only process specific message types
      const allowedMessageTypes = ['SMS', 'Email', 'Live Chat', 'GMB'];
      if (!messageData.messageType || !allowedMessageTypes.includes(messageData.messageType)) {
        return {
          status: 'ignored',
          reason: `Not a supported message type: ${messageData.messageType}`
        };
      }
      
      // Find lead by contactId (maps to customId in Lead model)
      const lead = await this.prisma.lead.findFirst({
        where: { customId: messageData.contactId }
      });
      
      if (!lead) {
        throw new HttpException(
          { status: 'error', message: `No lead found with customId/contactId ${messageData.contactId}` },
          HttpStatus.NOT_FOUND
        );
      }
      
      // Generate a response using the message body from the payload
      const message = messageData.body || '';
      // This would call your AI response generation service
      const response = await this.generateResponse(message, lead.id);
      
      return {
        status: 'success',
        message: response
      };
    } catch (error) {
      this.logger.error(`Error processing outbound.message webhook: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        { status: 'error', message: error.message, data: payload },
        HttpStatus.BAD_REQUEST
      );
    }
  }
  
  /**
   * Generate a response to a lead message
   * This is a placeholder for the actual AI response generation
   */
  private async generateResponse(message: string, leadId: number): Promise<string> {
    // In a real implementation, this would call your AI service
    // For now, we'll return a simple response
    this.logger.log(`Generating response for lead ${leadId} to message: ${message}`);
    return `Thank you for your message: "${message}". Our team will get back to you shortly.`;
  }
}
