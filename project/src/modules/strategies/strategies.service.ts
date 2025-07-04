import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateStrategyDto } from './dto/create-strategy.dto';
import { UpdateStrategyDto } from './dto/update-strategy.dto';

@Injectable()
export class StrategiesService {
  constructor(private prisma: PrismaService) {}

  async create(createStrategyDto: CreateStrategyDto) {
    return this.prisma.strategy.create({
      data: createStrategyDto,
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

  async findOne(id: number) {
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

  async update(id: number, updateStrategyDto: UpdateStrategyDto) {
    try {
      return await this.prisma.strategy.update({
        where: { id },
        data: updateStrategyDto,
      });
    } catch (error) {
      throw new NotFoundException(`Strategy with ID ${id} not found`);
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.strategy.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Strategy with ID ${id} not found`);
    }
  }
}
