import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateStrategyDto } from './dto/create-strategy.dto';
import { UpdateStrategyDto } from './dto/update-strategy.dto';
import { PromptTemplatesService } from '../prompt-templates/prompt-templates.service';

@Injectable()
export class StrategiesService {
  private readonly logger = new Logger(StrategiesService.name);

  constructor(
    private prisma: PrismaService,
    private promptTemplatesService: PromptTemplatesService
  ) {}

  async create(createStrategyDto: CreateStrategyDto, subAccountId: number) {
    this.logger.log(`Creating new strategy: ${createStrategyDto.name} for user ${createStrategyDto.regularUserId}, subAccount ${subAccountId}`);
    
    // If no promptTemplateId is provided, get the active template as fallback
    if (!createStrategyDto.promptTemplateId) {
      this.logger.debug('No promptTemplateId provided, attempting to find active template');
      try {
        const activeTemplate = await this.promptTemplatesService.getActive();
        createStrategyDto.promptTemplateId = activeTemplate.id;
        this.logger.debug(`Using active prompt template: ${activeTemplate.id}`);
      } catch (error) {
        this.logger.warn('No active template found, searching for any available template', error);
        // If no active template exists, get the first available template
        const templates = await this.promptTemplatesService.findAll();
        if (templates.length > 0) {
          createStrategyDto.promptTemplateId = templates[0].id;
          this.logger.debug(`Using first available template: ${templates[0].id} (${templates.length} templates found)`);
        } else {
          this.logger.error('No prompt templates available');
          throw new Error('No prompt templates available. Please create a prompt template first.');
        }
      }
    } else {
      this.logger.debug(`Using provided promptTemplateId: ${createStrategyDto.promptTemplateId}`);
    }

    // DTO fields now match Prisma schema exactly - just add subAccountId
    const strategyData = {
      ...createStrategyDto,
      subAccountId,
    };

    try {
      const createdStrategy = await this.prisma.strategy.create({
        data: strategyData,
      });
      this.logger.log(`Strategy created successfully: ID ${createdStrategy.id}, name: ${createdStrategy.name}`);
      return createdStrategy;
    } catch (error) {
      this.logger.error(`Failed to create strategy: ${createStrategyDto.name}`, error);
      throw error;
    }
  }

  async findAll() {
    this.logger.debug('Finding all strategies');
    try {
      const strategies = await this.prisma.strategy.findMany({
        include: {
          regularUser: true,
          leads: true,
        },
      });
      this.logger.log(`Found ${strategies.length} strategies`);
      return strategies;
    } catch (error) {
      this.logger.error('Failed to find all strategies', error);
      throw error;
    }
  }

  async findAllBySubAccount(subAccountId: number) {
    this.logger.debug(`Finding all strategies for subAccount: ${subAccountId}`);
    try {
      const strategies = await this.prisma.strategy.findMany({
        where: { subAccountId },
        include: {
          regularUser: true,
          leads: true,
        },
      });
      this.logger.log(`Found ${strategies.length} strategies for subAccount ${subAccountId}`);
      return strategies;
    } catch (error) {
      this.logger.error(`Failed to find strategies for subAccount ${subAccountId}`, error);
      throw error;
    }
  }

  async findAllByUser(userId: number) {
    this.logger.debug(`Finding all strategies for user: ${userId}`);
    try {
      const strategies = await this.prisma.strategy.findMany({
        where: { regularUserId: userId },
        include: {
          leads: true,
        },
      });
      this.logger.log(`Found ${strategies.length} strategies for user ${userId}`);
      return strategies;
    } catch (error) {
      this.logger.error(`Failed to find strategies for user ${userId}`, error);
      throw error;
    }
  }

  async findAllByAdmin(adminId: number) {
    this.logger.debug(`Finding all strategies for admin: ${adminId}`);
    // All admins can see all strategies
    try {
      const strategies = await this.prisma.strategy.findMany({
        include: {
          regularUser: true,
          leads: true,
          subAccount: {
            select: { id: true, name: true }
          }
        },
      });
      this.logger.log(`Admin ${adminId} retrieved ${strategies.length} strategies`);
      return strategies;
    } catch (error) {
      this.logger.error(`Failed to find strategies for admin ${adminId}`, error);
      throw error;
    }
  }

  async findOne(id: number, userId: number, userRole: string) {
    this.logger.debug(`Finding strategy ${id} for user ${userId} (role: ${userRole})`);
    try {
      const strategy = await this.prisma.strategy.findUnique({
        where: { id },
        include: {
          regularUser: true,
          leads: true,
        },
      });

      if (!strategy) {
        this.logger.warn(`Strategy ${id} not found for user ${userId}`);
        throw new NotFoundException(`Strategy with ID ${id} not found`);
      }

      // Check if user has permission to access this strategy
      if (userRole !== 'admin' && userRole !== 'super_admin' && strategy.regularUserId !== userId) {
        this.logger.warn(`User ${userId} attempted to access strategy ${id} owned by user ${strategy.regularUserId}`);
        throw new ForbiddenException('Access denied');
      }

      this.logger.log(`Strategy ${id} found: ${strategy.name} (${strategy.leads?.length || 0} leads)`);
      return strategy;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Failed to find strategy ${id}`, error);
      throw error;
    }
  }

  async findByUserId(userId: number) {
    this.logger.debug(`Finding strategies by userId: ${userId}`);
    try {
      const strategies = await this.prisma.strategy.findMany({
        where: { regularUserId: userId },
        include: {
          leads: true,
        },
      });
      this.logger.log(`Found ${strategies.length} strategies for userId ${userId}`);
      return strategies;
    } catch (error) {
      this.logger.error(`Failed to find strategies for userId ${userId}`, error);
      throw error;
    }
  }

  async update(id: number, updateStrategyDto: UpdateStrategyDto, userId: number, userRole: string) {
    this.logger.log(`Updating strategy ${id} by user ${userId} (role: ${userRole})`);
    this.logger.debug(`Update data: ${JSON.stringify(updateStrategyDto)}`);
    
    // Check if strategy exists
    const strategy = await this.prisma.strategy.findUnique({
      where: { id },
    });

    if (!strategy) {
      this.logger.warn(`Strategy ${id} not found for update by user ${userId}`);
      throw new NotFoundException(`Strategy with ID ${id} not found`);
    }

    // Check if user has permission to update this strategy
    if (userRole !== 'admin' && userRole !== 'super_admin' && strategy.regularUserId !== userId) {
      this.logger.warn(`User ${userId} attempted to update strategy ${id} owned by user ${strategy.regularUserId}`);
      throw new ForbiddenException('Access denied');
    }

    this.logger.debug(`Strategy ${id} found: ${strategy.name}, owned by user ${strategy.regularUserId}`);

    // Check authorization for sensitive fields
    if (updateStrategyDto.regularUserId !== undefined && userRole !== 'admin' && userRole !== 'super_admin') {
      this.logger.warn(`User ${userId} attempted to change strategy ${id} ownership`);
      throw new ForbiddenException('Only admins can change strategy ownership');
    }

    if (updateStrategyDto.subAccountId !== undefined && userRole !== 'admin' && userRole !== 'super_admin') {
      this.logger.warn(`User ${userId} attempted to change strategy ${id} subAccount`);
      throw new ForbiddenException('Only admins can change strategy subAccount');
    }

    // DTO fields now match Prisma schema exactly - no mapping needed
    const updateData = { ...updateStrategyDto };

    try {
      const updatedStrategy = await this.prisma.strategy.update({
        where: { id },
        data: updateData,
      });
      this.logger.log(`Strategy ${id} updated successfully: ${updatedStrategy.name}`);
      return updatedStrategy;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Failed to update strategy ${id}`, error);
      throw new NotFoundException(`Strategy with ID ${id} not found`);
    }
  }

  async remove(id: number, userId: number, userRole: string) {
    this.logger.log(`Removing strategy ${id} by user ${userId} (role: ${userRole})`);
    
    // Check if strategy exists
    const strategy = await this.prisma.strategy.findUnique({
      where: { id },
    });

    if (!strategy) {
      this.logger.warn(`Strategy ${id} not found for deletion by user ${userId}`);
      throw new NotFoundException(`Strategy with ID ${id} not found`);
    }

    // Check if user has permission to delete this strategy
    if (userRole !== 'admin' && userRole !== 'super_admin' && strategy.regularUserId !== userId) {
      this.logger.warn(`User ${userId} attempted to delete strategy ${id} owned by user ${strategy.regularUserId}`);
      throw new ForbiddenException('Access denied');
    }

    this.logger.debug(`Strategy ${id} found: ${strategy.name}, owned by user ${strategy.regularUserId}`);

    try {
      const deletedStrategy = await this.prisma.strategy.delete({
        where: { id },
      });
      this.logger.log(`Strategy ${id} deleted successfully: ${deletedStrategy.name}`);
      return deletedStrategy;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Failed to delete strategy ${id}`, error);
      throw new NotFoundException(`Strategy with ID ${id} not found`);
    }
  }

  async duplicate(id: number, userId: number, userRole: string) {
    this.logger.log(`Duplicating strategy ${id} by user ${userId} (role: ${userRole})`);
    
    // Check if strategy exists
    const strategy = await this.prisma.strategy.findUnique({
      where: { id },
    });

    if (!strategy) {
      this.logger.warn(`Strategy ${id} not found for duplication by user ${userId}`);
      throw new NotFoundException(`Strategy with ID ${id} not found`);
    }

    // Check if user has permission to duplicate this strategy
    if (userRole !== 'admin' && userRole !== 'super_admin' && strategy.regularUserId !== userId) {
      this.logger.warn(`User ${userId} attempted to duplicate strategy ${id} owned by user ${strategy.regularUserId}`);
      throw new ForbiddenException('Access denied');
    }

    this.logger.debug(`Duplicating strategy: ${strategy.name} (ID: ${id}), subAccount: ${strategy.subAccountId}, promptTemplate: ${strategy.promptTemplateId}`);

    // Create a duplicate strategy with "(Copy)" suffix - DTO fields match Prisma schema
    const duplicateData: CreateStrategyDto = {
      name: `${strategy.name} (Copy)`,
      regularUserId: strategy.regularUserId,
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

    // DTO fields now match Prisma schema exactly - just add subAccountId
    const strategyData = {
      ...duplicateData,
      subAccountId: strategy.subAccountId,
    };

    try {
      const duplicatedStrategy = await this.prisma.strategy.create({
        data: strategyData,
      });
      this.logger.log(`Strategy ${id} duplicated successfully: new ID ${duplicatedStrategy.id}, name: ${duplicatedStrategy.name}`);
      return duplicatedStrategy;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Failed to duplicate strategy ${id}`, error);
      throw error;
    }
  }
}
