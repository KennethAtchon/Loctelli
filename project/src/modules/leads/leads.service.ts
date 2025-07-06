import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async create(CreateLeadDto: CreateLeadDto) {
    return this.prisma.lead.create({
      data: CreateLeadDto,
    });
  }

  async findAll() {
    return this.prisma.lead.findMany({
      include: {
        user: true,
        strategy: true,
        bookings: true,
      },
    });
  }

  async findOne(id: number, userId: number, userRole: string) {
    const client = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        user: true,
        strategy: true,
        bookings: true,
      },
    });

    if (!client) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    // Check if user has permission to access this client
    if (userRole !== 'admin' && userRole !== 'super_admin' && client.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return client;
  }

  async findByUserId(userId: number) {
    return this.prisma.lead.findMany({
      where: { userId },
      include: {
        strategy: true,
        bookings: true,
      },
    });
  }

  async findByStrategyId(strategyId: number, userId: number, userRole: string) {
    // First check if the strategy belongs to the user
    const strategy = await this.prisma.strategy.findUnique({
      where: { id: strategyId },
    });

    if (!strategy) {
      throw new NotFoundException(`Strategy with ID ${strategyId} not found`);
    }

    // Check if user has permission to access this strategy's clients
    if (userRole !== 'admin' && userRole !== 'super_admin' && strategy.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.lead.findMany({
      where: { strategyId },
      include: {
        strategy: true,
        bookings: true,
      },
    });
  }

  async update(id: number, updateLeadDto: UpdateLeadDto, userId: number, userRole: string) {
    // Check if client exists and user has permission
    const client = await this.prisma.lead.findUnique({
      where: { id },
    });

    if (!client) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    // Check if user has permission to update this client
    if (userRole !== 'admin' && userRole !== 'super_admin' && client.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    try {
      return await this.prisma.lead.update({
        where: { id },
        data: updateLeadDto,
      });
    } catch (error) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }
  }

  async appendMessage(id: number, message: any) {
    const client = await this.prisma.lead.findUnique({
      where: { id },
      select: { messageHistory: true },
    });

    if (!client) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    // Parse existing messages or initialize empty array
    const existingMessages = client.messageHistory ? JSON.parse(client.messageHistory as string) : [];
    
    // Add new message
    existingMessages.push(message);

    // Update client with new messages array
    return this.prisma.lead.update({
      where: { id },
      data: {
        messageHistory: JSON.stringify(existingMessages),
        lastMessage: message.content,
        lastMessageDate: new Date().toISOString(),
      },
    });
  }

  async remove(id: number, userId: number, userRole: string) {
    // Check if client exists and user has permission
    const client = await this.prisma.lead.findUnique({
      where: { id },
    });

    if (!client) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    // Check if user has permission to delete this client
    if (userRole !== 'admin' && userRole !== 'super_admin' && client.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    try {
      return await this.prisma.lead.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }
  }
}
