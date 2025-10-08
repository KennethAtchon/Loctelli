import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateStrategyDto } from './dto/create-strategy.dto';
import { UpdateStrategyDto } from './dto/update-strategy.dto';
import { PromptTemplatesService } from '../prompt-templates/prompt-templates.service';

@Injectable()
export class StrategiesService {
  constructor(
    private prisma: PrismaService,
    private promptTemplatesService: PromptTemplatesService
  ) {}

  async create(createStrategyDto: CreateStrategyDto, subAccountId: number) {
    // If no promptTemplateId is provided, get the active template as fallback
    if (!createStrategyDto.promptTemplateId) {
      try {
        const activeTemplate = await this.promptTemplatesService.getActive();
        createStrategyDto.promptTemplateId = activeTemplate.id;
      } catch (error) {
        // If no active template exists, get the first available template
        const templates = await this.promptTemplatesService.findAll();
        if (templates.length > 0) {
          createStrategyDto.promptTemplateId = templates[0].id;
        } else {
          throw new Error('No prompt templates available. Please create a prompt template first.');
        }
      }
    }

    // Ensure promptTemplateId is set before creating
    const { userId, subAccountId: _, promptTemplateId, ...restDto } = createStrategyDto;
    const strategyData = {
      ...restDto,
      regularUser: {
        connect: { id: userId }
      },
      promptTemplate: {
        connect: { id: promptTemplateId! }
      },
      subAccount: {
        connect: { id: subAccountId }
      },
    };

    return this.prisma.strategy.create({
      data: strategyData,
    });
  }

  async findAll() {
    return this.prisma.strategy.findMany({
      include: {
        regularUser: true,
        leads: true,
      },
    });
  }

  async findAllBySubAccount(subAccountId: number) {
    return this.prisma.strategy.findMany({
      where: { subAccountId },
      include: {
        regularUser: true,
        leads: true,
      },
    });
  }

  async findAllByUser(userId: number) {
    return this.prisma.strategy.findMany({
      where: { regularUserId: userId },
      include: {
        leads: true,
      },
    });
  }

  async findAllByAdmin(adminId: number) {
    // All admins can see all strategies
    return this.prisma.strategy.findMany({
      include: {
        regularUser: true,
        leads: true,
        subAccount: {
          select: { id: true, name: true }
        }
      },
    });
  }

  async findOne(id: number, userId: number, userRole: string) {
    const strategy = await this.prisma.strategy.findUnique({
      where: { id },
      include: {
        regularUser: true,
        leads: true,
      },
    });

    if (!strategy) {
      throw new NotFoundException(`Strategy with ID ${id} not found`);
    }

    return strategy;
  }

  async findByUserId(userId: number) {
    return this.prisma.strategy.findMany({
      where: { regularUserId: userId },
      include: {
        leads: true,
      },
    });
  }

  async update(id: number, updateStrategyDto: UpdateStrategyDto, userId: number, userRole: string) {
    // Check if strategy exists
    const strategy = await this.prisma.strategy.findUnique({
      where: { id },
    });

    if (!strategy) {
      throw new NotFoundException(`Strategy with ID ${id} not found`);
    }

    try {
      return await this.prisma.strategy.update({
        where: { id },
        data: updateStrategyDto,
      });
    } catch (error) {
      throw new NotFoundException(`Strategy with ID ${id} not found`);
    }
  }

  async remove(id: number, userId: number, userRole: string) {
    // Check if strategy exists
    const strategy = await this.prisma.strategy.findUnique({
      where: { id },
    });

    if (!strategy) {
      throw new NotFoundException(`Strategy with ID ${id} not found`);
    }

    try {
      return await this.prisma.strategy.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Strategy with ID ${id} not found`);
    }
  }

  async duplicate(id: number, userId: number, userRole: string) {
    // Check if strategy exists
    const strategy = await this.prisma.strategy.findUnique({
      where: { id },
    });

    if (!strategy) {
      throw new NotFoundException(`Strategy with ID ${id} not found`);
    }

    // Create a duplicate strategy with "(Copy)" suffix - using new fields
    const duplicateData: CreateStrategyDto = {
      name: `${strategy.name} (Copy)`,
      userId: strategy.regularUserId,
      promptTemplateId: strategy.promptTemplateId,
      description: strategy.description || undefined,
      tag: strategy.tag || undefined,
      industryContext: strategy.industryContext || undefined,
      aiName: strategy.aiName,
      aiRole: strategy.aiRole,
      companyBackground: strategy.companyBackground || undefined,
      conversationTone: strategy.conversationTone,
      communicationStyle: strategy.communicationStyle || undefined,
      qualificationQuestions: strategy.qualificationQuestions,
      disqualificationRules: strategy.disqualificationRules || undefined,
      objectionHandling: strategy.objectionHandling,
      closingStrategy: strategy.closingStrategy,
      bookingInstructions: strategy.bookingInstructions || undefined,
      outputGuidelines: strategy.outputGuidelines || undefined,
      prohibitedBehaviors: strategy.prohibitedBehaviors || undefined,
      metadata: strategy.metadata || undefined,
      delayMin: strategy.delayMin || undefined,
      delayMax: strategy.delayMax || undefined,
      isActive: strategy.isActive,
    };

    // Ensure promptTemplateId is set and include SubAccount context
    const { userId: duplicateUserId, subAccountId: __, promptTemplateId: duplicateTemplateId, ...restDuplicateData } = duplicateData;
    const strategyData = {
      ...restDuplicateData,
      regularUser: {
        connect: { id: duplicateUserId }
      },
      promptTemplate: {
        connect: { id: duplicateTemplateId! }
      },
      subAccount: {
        connect: { id: strategy.subAccountId }
      },
    };

    return this.prisma.strategy.create({
      data: strategyData,
    });
  }

  /**
   * Build the final system prompt from strategy fields and runtime context
   */
  async buildFinalPrompt(strategyId: number, lead: any, user: any): Promise<string> {
    const strategy = await this.prisma.strategy.findUnique({
      where: { id: strategyId },
      include: { promptTemplate: true },
    });

    if (!strategy) {
      throw new NotFoundException('Strategy not found');
    }

    // Build complete prompt from strategy fields
    const sections = [
      `You are ${strategy.aiName}, a ${strategy.aiRole} for ${user.company}.`,
      '',
      'COMPANY CONTEXT:',
      `You work for ${user.company}, owned and managed by ${user.name}.`,
      strategy.companyBackground || '',
      '',
      'LEAD CONTEXT:',
      `You're currently speaking with ${lead.name} from ${lead.phone}.`,
      '',
      'CONVERSATION TONE & STYLE:',
      strategy.conversationTone,
      strategy.communicationStyle || '',
      '',
      'QUALIFICATION APPROACH:',
      strategy.qualificationQuestions,
    ];

    if (strategy.disqualificationRules) {
      sections.push('', 'DISQUALIFICATION RULES:', strategy.disqualificationRules);
    }

    sections.push('', 'OBJECTION HANDLING:', strategy.objectionHandling);
    sections.push('', 'CLOSING STRATEGY:', strategy.closingStrategy);

    if (strategy.bookingInstructions) {
      sections.push('', 'BOOKING INSTRUCTIONS:', strategy.bookingInstructions);
    }

    if (strategy.outputGuidelines) {
      sections.push('', 'OUTPUT GUIDELINES:', strategy.outputGuidelines);
    }

    if (strategy.prohibitedBehaviors) {
      sections.push('', 'PROHIBITED BEHAVIORS:', strategy.prohibitedBehaviors);
    }

    return sections.filter(s => s !== null).join('\n');
  }
}
