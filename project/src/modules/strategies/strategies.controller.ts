import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, HttpException, HttpStatus } from '@nestjs/common';
import { StrategiesService } from './strategies.service';
import { CreateStrategyDto } from './dto/create-strategy.dto';
import { UpdateStrategyDto } from './dto/update-strategy.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('strategy')
export class StrategiesController {
  constructor(private readonly strategiesService: StrategiesService) {}

  @Post()
  create(@Body() createStrategyDto: CreateStrategyDto, @CurrentUser() user) {
    // Ensure the strategy is created for the current user
    return this.strategiesService.create({ ...createStrategyDto, userId: user.userId });
  }

  @Get()
  findAll(@CurrentUser() user, @Query('userId') userId?: string) {
    if (userId) {
      const parsedUserId = parseInt(userId, 10);
      if (isNaN(parsedUserId)) {
        throw new HttpException('Invalid userId parameter', HttpStatus.BAD_REQUEST);
      }
      // Only allow viewing other users' strategies if admin
      if (user.role !== 'admin' && user.role !== 'super_admin' && user.userId !== parsedUserId) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }
      return this.strategiesService.findByUserId(parsedUserId);
    }
    // Return current user's strategies
    return this.strategiesService.findByUserId(user.userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user) {
    return this.strategiesService.findOne(id, user.userId, user.role);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStrategyDto: UpdateStrategyDto,
    @CurrentUser() user
  ) {
    return this.strategiesService.update(id, updateStrategyDto, user.userId, user.role);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user) {
    return this.strategiesService.remove(id, user.userId, user.role);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id', ParseIntPipe) id: number, @CurrentUser() user) {
    return this.strategiesService.duplicate(id, user.userId, user.role);
  }
}
