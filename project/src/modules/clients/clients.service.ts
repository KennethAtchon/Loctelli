import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(createClientDto: CreateClientDto) {
    return this.prisma.client.create({
      data: createClientDto,
    });
  }

  async findAll() {
    return this.prisma.client.findMany({
      include: {
        user: true,
        strategy: true,
        bookings: true,
      },
    });
  }

  async findOne(id: number) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        user: true,
        strategy: true,
        bookings: true,
      },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    return client;
  }

  async findByUserId(userId: number) {
    return this.prisma.client.findMany({
      where: { userId },
      include: {
        strategy: true,
        bookings: true,
      },
    });
  }

  async findByStrategyId(strategyId: number) {
    return this.prisma.client.findMany({
      where: { strategyId },
      include: {
        user: true,
        bookings: true,
      },
    });
  }

  async update(id: number, updateClientDto: UpdateClientDto) {
    try {
      return await this.prisma.client.update({
        where: { id },
        data: updateClientDto,
      });
    } catch (error) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }
  }

  async appendMessage(id: number, message: any) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      select: { messageHistory: true },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    // Parse existing messages or initialize empty array
    const existingMessages = client.messageHistory ? JSON.parse(client.messageHistory as string) : [];
    
    // Add new message
    existingMessages.push(message);

    // Update client with new messages array
    return this.prisma.client.update({
      where: { id },
      data: {
        messageHistory: JSON.stringify(existingMessages),
        lastMessage: message.content,
        lastMessageDate: new Date().toISOString(),
      },
    });
  }

  async remove(id: number) {
    try {
      return await this.prisma.client.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }
  }
}
