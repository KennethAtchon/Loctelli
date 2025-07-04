import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PromptHelperService } from '../../modules/chat/prompt-helper.service';
import { BookingHelperService } from '../../modules/bookings/booking-helper.service';
import axios from 'axios';

interface ChatMessage {
  role: string;
  content: string;
}

interface MessageHistory {
  from: string;
  message: string;
}

@Injectable()
export class SalesBotService implements OnModuleInit {
  private readonly logger = new Logger(SalesBotService.name);
  private readonly openaiModel = 'gpt-4o-mini';
  private readonly temperature = 0.7;
  private readonly maxHistory = 20;
  private readonly openaiApiKey: string;
  
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private promptHelper: PromptHelperService,
    private bookingHelper: BookingHelperService
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
  }

  async onModuleInit() {
    this.logger.log('Sales Bot Service initialized');
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleScheduledTasks() {
    this.logger.log('Running scheduled sales bot tasks');
    await this.processFollowUps();
  }
  
  /**
   * Generate a response for a client message
   * @param message The client's message
   * @param clientId The client's ID
   * @returns The bot's response
   */
  async generateResponse(message: string, clientId: number): Promise<string> {
    this.logger.log(`Generating response for clientId=${clientId}, message=${message.substring(0, 50)}...`);
    
    try {
      // Get client from database
      const client = await this.prisma.client.findUnique({
        where: { id: clientId }
      });
      
      if (!client) {
        this.logger.warn(`No client found for clientId=${clientId}`);
        return "Sorry, I couldn't find your information.";
      }
      
      // Get user and strategy
      const user = await this.prisma.user.findUnique({
        where: { id: client.userId }
      });
      
      const strategy = await this.prisma.strategy.findUnique({
        where: { id: client.strategyId }
      });
      
      // Append message to history
      await this.appendMessageToHistory(client, 'user', message);
      
      // Get message history
      const history = client.messageHistory ? 
        (JSON.parse(client.messageHistory as string) as MessageHistory[]).slice(-this.maxHistory) : 
        [];
      
      this.logger.debug(`Using history with ${history.length} messages for clientId=${clientId}`);
      
      // Generate prompt
      const prompt = this.promptHelper.composePrompt(client, user, strategy, history);
      
      // Create bot response
      const botResponse = await this.createBotResponse(prompt);
      
      // Append bot response to history
      await this.appendMessageToHistory(client, 'bot', botResponse);
      
      // Check for booking confirmation
      if (user && user.bookingEnabled) {
        const booking = await this.bookingHelper.parseAndCreateBooking(botResponse, user.id, clientId);
        if (booking) {
          this.logger.log(`Booking created for userId=${user.id}, clientId=${clientId}: bookingId=${booking.id}`);
        }
      }
      
      this.logger.log(`Response generated for clientId=${clientId}: ${botResponse.substring(0, 50)}...`);
      return botResponse;
    } catch (error) {
      this.logger.error(`Error generating response for clientId=${clientId}: ${error}`);
      return "An error occurred. Please try again.";
    }
  }

  private async processFollowUps() {
    try {
      this.logger.log('Processing follow-ups for clients');
      
      // Find clients that need follow-up (example logic)
      const clients = await this.prisma.client.findMany({
        where: {
          // Example: clients with no messages in the last 7 days
          lastMessageDate: {
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        } as any, // Type assertion to bypass type checking for dynamic fields
        include: {
          user: true,
          strategy: true
        }
      });
      
      this.logger.log(`Found ${clients.length} clients requiring follow-up`);
      
      // Process each client
      for (const client of clients) {
        await this.sendFollowUpMessage(client);
      }
    } catch (error) {
      this.logger.error('Error processing follow-ups', error);
    }
  }
  
  private async sendFollowUpMessage(client: any) {
    try {
      this.logger.log(`Sending follow-up to client ${client.id}`);
      
      // Example follow-up message
      const message = {
        content: `Hi ${client.name}, just checking in to see how you're doing.`,
        role: 'system',
        timestamp: new Date().toISOString(),
        metadata: { automated: true }
      };
      
      // Parse existing messages or initialize empty array
      const existingMessages = client.messageHistory ? JSON.parse(client.messageHistory as string) : [];
      
      // Add new message
      existingMessages.push(message);
      
      // Update client with new message
      await this.prisma.client.update({
        where: { id: client.id },
        data: {
          messageHistory: JSON.stringify(existingMessages),
          lastMessage: message.content,
          lastMessageDate: new Date().toISOString(),
        } as any,
      });
      
      this.logger.log(`Follow-up sent to client ${client.id}`);
    } catch (error) {
      this.logger.error(`Error sending follow-up to client ${client.id}`, error);
    }
  }
  
  /**
   * Append a message to the client's message history
   * @param client The client object
   * @param fromRole The role of the message sender ('user' or 'bot')
   * @param message The message content
   */
  private async appendMessageToHistory(client: any, fromRole: string, message: string): Promise<void> {
    this.logger.debug(`Appending message to history for clientId=${client.id}, role=${fromRole}, message=${message.substring(0, 50)}...`);
    
    const newMessage = { from: fromRole, message };
    
    // Parse existing messages or initialize empty array
    const existingMessages = client.messageHistory ? 
      JSON.parse(client.messageHistory as string) : 
      [];
    
    // Add new message
    existingMessages.push(newMessage);
    
    // Update client with new message history
    await this.prisma.client.update({
      where: { id: client.id },
      data: {
        messageHistory: JSON.stringify(existingMessages),
        lastMessage: message,
        lastMessageDate: new Date().toISOString(),
      } as any,
    });
    
    this.logger.log(`Message appended to history for clientId=${client.id}, history_length=${existingMessages.length}`);
  }
  
  /**
   * Create a bot response using the OpenAI API
   * @param messages The messages to send to OpenAI
   * @returns The bot's response
   */
  private async createBotResponse(messages: ChatMessage[]): Promise<string> {
    this.logger.log('Creating bot response via OpenAI API');
    this.logger.debug(`Input messages: ${JSON.stringify(messages.map(m => ({ 
      role: m.role, 
      content: m.content.substring(0, 50) + '...' 
    })))}`);
    
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.openaiModel,
          messages,
          temperature: this.temperature,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.openaiApiKey}`,
          },
        }
      );
      
      const botResponse = response.data.choices[0].message.content;
      this.logger.log('Bot response generated successfully');
      this.logger.debug(`Bot response: ${botResponse.substring(0, 100)}...`);
      return botResponse;
    } catch (error) {
      this.logger.error(`OpenAI API error: ${error}`);
      return "Sorry, I'm having trouble responding right now. Please try again later.";
    }
  }
}
