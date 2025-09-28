import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreatePromptTemplateDto } from './dto/create-prompt-template.dto';
import { UpdatePromptTemplateDto } from './dto/update-prompt-template.dto';

@Injectable()
export class PromptTemplatesService {
  private readonly logger = new Logger(PromptTemplatesService.name);

  constructor(private prisma: PrismaService) {}

  async findAll() {
    this.logger.debug('Finding all prompt templates');
    const templates = await this.prisma.promptTemplate.findMany({
      include: {
        createdByAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Add strategy count for each template
    const templatesWithCount = await Promise.all(
      templates.map(async (template) => {
        const strategyCount = await this.prisma.strategy.count({
          where: { promptTemplateId: template.id },
        });
        return {
          ...template,
          strategyCount,
        };
      })
    );

    return templatesWithCount;
  }

  async findOne(id: number) {
    this.logger.debug(`Finding prompt template with id: ${id}`);
    const template = await this.prisma.promptTemplate.findUnique({
      where: { id },
      include: {
        createdByAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`Prompt template with ID ${id} not found`);
    }

    return template;
  }

  async create(createDto: CreatePromptTemplateDto, adminId: number) {
    this.logger.debug(`Creating prompt template: ${createDto.name} with adminId: ${adminId}`);

    try {
      // If this template is being set as active, deactivate all others
      if (createDto.isActive) {
        await this.deactivateAllTemplates();
      }

      const result = await this.prisma.promptTemplate.create({
        data: {
          ...createDto,
          createdByAdminId: adminId,
        },
        include: {
          createdByAdmin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      this.logger.debug(`Successfully created prompt template with ID: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create prompt template: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: number, updateDto: UpdatePromptTemplateDto) {
    this.logger.debug(`Updating prompt template with id: ${id}`);

    try {
      // Check if template exists
      const existingTemplate = await this.findOne(id);

      // If this template is being set as active, deactivate all others
      if (updateDto.isActive) {
        await this.deactivateAllTemplates();
      }

      const result = await this.prisma.promptTemplate.update({
        where: { id },
        data: updateDto,
        include: {
          createdByAdmin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      this.logger.debug(`Successfully updated prompt template with ID: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to update prompt template: ${error.message}`, error.stack);
      throw error;
    }
  }

  async delete(id: number) {
    this.logger.debug(`Deleting prompt template with id: ${id}`);

    const template = await this.findOne(id);

    // If deleting active template, activate the first available template
    if (template.isActive) {
      const templates = await this.findAll();
      const otherTemplates = templates.filter(t => t.id !== id);
      if (otherTemplates.length > 0) {
        await this.activate(otherTemplates[0].id);
      }
    }

    return this.prisma.promptTemplate.delete({
      where: { id },
    });
  }

  async activate(id: number) {
    this.logger.debug(`Activating prompt template with id: ${id}`);

    // Check if template exists
    await this.findOne(id);

    // Deactivate all templates first
    await this.deactivateAllTemplates();

    // Activate the specified template
    return this.prisma.promptTemplate.update({
      where: { id },
      data: { isActive: true },
      include: {
        createdByAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async getActive() {
    this.logger.debug('Getting active prompt template');
    const activeTemplate = await this.prisma.promptTemplate.findFirst({
      where: { isActive: true },
    });

    if (!activeTemplate) {
      // If no active template, get the first available template as fallback
      const templates = await this.findAll();
      if (templates.length > 0) {
        return templates[0];
      }
      throw new NotFoundException('No prompt templates found');
    }

    return activeTemplate;
  }

  async ensureActiveExists(adminId: number) {
    this.logger.debug('Ensuring active prompt template exists');
    
    const activeTemplate = await this.prisma.promptTemplate.findFirst({
      where: { isActive: true },
    });
    
    if (!activeTemplate) {
      this.logger.log('Creating active prompt template');
      return this.create({
        name: 'Default Sales Prompt',
        description: 'Standard conversational AI prompt for sales',
        isActive: true,
        systemPrompt: 'You are a proactive sales representative working for the company owner. Your primary mission is to QUALIFY leads and CLOSE qualified prospects. You must actively guide every conversation with a clear sales process: 1) Build rapport, 2) Qualify the lead (budget, needs, decision-making authority, timeline), 3) Present solutions for qualified leads, 4) Close with a meeting/next step. Take control of conversations - don\'t just respond passively. Ask strategic questions to uncover pain points and buying intent. Be friendly but purposeful.',
        role: 'conversational AI assistant and customer service representative',
        instructions: 'SALES PROCESS - Follow this framework: 1) RAPPORT: Start warm, use their name and say your name, ask how they\'re doing. 2) QUALIFY: Ask about their business, current challenges, budget range, decision-making process, and timeline. Use questions like "What\'s your biggest challenge with [relevant area]?" "What\'s your budget range for solving this?" "Who else is involved in making this decision?" 3) PRESENT: Only for qualified leads - present relevant solutions that match their needs and budget. 4) CLOSE: Always end qualified conversations with a meeting request. Be direct: "Based on what you\'ve shared, I think we can help. When would you be available for a 15-minute call to discuss this further?" Remember: You control the conversation flow. Don\'t just answer questions - guide toward qualification and closing.',
        bookingInstruction: `CLOSING QUALIFIED LEADS: You have booking tools to close deals immediately. When a lead is QUALIFIED (has budget, need, authority, timeline), be direct and assumptive in your close:

CLOSING SCRIPTS:
- "Perfect! Based on everything you've shared, I can help you solve this. Let me check my calendar for this week."
- "I have exactly what you need. Are you available Tuesday at 2 PM or Thursday at 3 PM?"
- "Let's get this moving for you. I can do Monday morning or Wednesday afternoon - which works better?"

BOOKING PROCESS:
1. Use check_availability tool to find open slots
2. Present 2-3 specific options (day/time)
3. Once they choose, use book_meeting tool immediately
4. Confirm the booking: "Perfect! I've got you scheduled for [day] at [time]. You'll receive a confirmation shortly."

Be assumptive - don't ask IF they want to meet, ask WHEN they can meet. Strike while the iron is hot!`,
        creativity: 7,
        temperature: 0.7,
      }, adminId);
    }
    
    return activeTemplate;
  }

  private async deactivateAllTemplates() {
    this.logger.debug('Deactivating all prompt templates');
    await this.prisma.promptTemplate.updateMany({
      data: { isActive: false },
    });
  }



  async validateOnlyOneActive() {
    this.logger.debug('Validating only one template is active');
    const activeTemplates = await this.prisma.promptTemplate.findMany({
      where: { isActive: true },
    });

    if (activeTemplates.length > 1) {
      this.logger.warn(`Found ${activeTemplates.length} active templates, deactivating all except the first`);
      // Keep only the first one active
      for (let i = 1; i < activeTemplates.length; i++) {
        await this.prisma.promptTemplate.update({
          where: { id: activeTemplates[i].id },
          data: { isActive: false },
        });
      }
    }
  }
} 