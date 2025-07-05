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

  async create(createStrategyDto: CreateStrategyDto) {
    // If no promptTemplateId is provided, get the default template
    if (!createStrategyDto.promptTemplateId) {
      const defaultTemplate = await this.promptTemplatesService.getDefaultTemplate();
      if (defaultTemplate) {
        createStrategyDto.promptTemplateId = defaultTemplate.id;
      } else {
        // If no default template exists, get the first available template
        const templates = await this.promptTemplatesService.findAll();
        if (templates.length > 0) {
          createStrategyDto.promptTemplateId = templates[0].id;
        } else {
          throw new Error('No prompt templates available. Please create a prompt template first.');
        }
      }
    }

    // Ensure promptTemplateId is set before creating
    const strategyData = {
      ...createStrategyDto,
      promptTemplateId: createStrategyDto.promptTemplateId!
    };

    return this.prisma.strategy.create({
      data: strategyData,
    });
  }

  async findAll() {
    return this.prisma.strategy.findMany({
      include: {
        user: true,
        clients: true,
      },
    });
  }

  async findOne(id: number, userId: number, userRole: string) {
    const strategy = await this.prisma.strategy.findUnique({
      where: { id },
      include: {
        user: true,
        clients: true,
      },
    });

    if (!strategy) {
      throw new NotFoundException(`Strategy with ID ${id} not found`);
    }

    // Check if user has permission to access this strategy
    if (userRole !== 'admin' && userRole !== 'super_admin' && strategy.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return strategy;
  }

  async findByUserId(userId: number) {
    return this.prisma.strategy.findMany({
      where: { userId },
      include: {
        clients: true,
      },
    });
  }

  async update(id: number, updateStrategyDto: UpdateStrategyDto, userId: number, userRole: string) {
    // Check if strategy exists and user has permission
    const strategy = await this.prisma.strategy.findUnique({
      where: { id },
    });

    if (!strategy) {
      throw new NotFoundException(`Strategy with ID ${id} not found`);
    }

    // Check if user has permission to update this strategy
    if (userRole !== 'admin' && userRole !== 'super_admin' && strategy.userId !== userId) {
      throw new ForbiddenException('Access denied');
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
    // Check if strategy exists and user has permission
    const strategy = await this.prisma.strategy.findUnique({
      where: { id },
    });

    if (!strategy) {
      throw new NotFoundException(`Strategy with ID ${id} not found`);
    }

    // Check if user has permission to delete this strategy
    if (userRole !== 'admin' && userRole !== 'super_admin' && strategy.userId !== userId) {
      throw new ForbiddenException('Access denied');
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
    // Check if strategy exists and user has permission
    const strategy = await this.prisma.strategy.findUnique({
      where: { id },
    });

    if (!strategy) {
      throw new NotFoundException(`Strategy with ID ${id} not found`);
    }

    // Check if user has permission to duplicate this strategy
    if (userRole !== 'admin' && userRole !== 'super_admin' && strategy.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Create a duplicate strategy with "(Copy)" suffix
    const duplicateData: CreateStrategyDto = {
      name: `${strategy.name} (Copy)`,
      userId: userId,
      tag: strategy.tag || undefined,
      tone: strategy.tone || undefined,
      aiInstructions: strategy.aiInstructions || undefined,
      objectionHandling: strategy.objectionHandling || undefined,
      qualificationPriority: strategy.qualificationPriority || undefined,
      creativity: strategy.creativity || undefined,
      aiObjective: strategy.aiObjective || undefined,
      disqualificationCriteria: strategy.disqualificationCriteria || undefined,
      exampleConversation: strategy.exampleConversation || undefined,
      delayMin: strategy.delayMin || undefined,
      delayMax: strategy.delayMax || undefined,
      promptTemplateId: strategy.promptTemplateId,
    };

    // Ensure promptTemplateId is set
    const strategyData = {
      ...duplicateData,
      promptTemplateId: duplicateData.promptTemplateId!
    };

    return this.prisma.strategy.create({
      data: strategyData,
    });
  }
}
