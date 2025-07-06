import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { StrategiesService } from './strategies.service';
import { CreateStrategyDto } from './dto/create-strategy.dto';
import { UpdateStrategyDto } from './dto/update-strategy.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Admin } from '../../auth/decorators/admin.decorator';
import { AdminGuard } from '../../auth/guards/admin.guard';

@Controller('strategy')
@UseGuards(AdminGuard)
export class StrategiesController {
  constructor(private readonly strategiesService: StrategiesService) {}

  @Post()
  @Admin()
  create(@Body() createStrategyDto: CreateStrategyDto, @CurrentUser() user) {
    // Admin users can create strategies for any regular user
    return this.strategiesService.create(createStrategyDto);
  }

  @Get()
  @Admin()
  findAll(@CurrentUser() user, @Query('userId') userId?: string) {
    if (userId) {
      const parsedUserId = parseInt(userId, 10);
      if (isNaN(parsedUserId)) {
        throw new HttpException('Invalid userId parameter', HttpStatus.BAD_REQUEST);
      }
      return this.strategiesService.findByUserId(parsedUserId);
    }
    
    // Admin users can see all strategies
    return this.strategiesService.findAll();
  }

  @Get(':id')
  @Admin()
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user) {
    return this.strategiesService.findOne(id, user.userId, user.role);
  }

  @Patch(':id')
  @Admin()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStrategyDto: UpdateStrategyDto,
    @CurrentUser() user
  ) {
    return this.strategiesService.update(id, updateStrategyDto, user.userId, user.role);
  }

  @Delete(':id')
  @Admin()
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user) {
    return this.strategiesService.remove(id, user.userId, user.role);
  }

  @Post(':id/duplicate')
  @Admin()
  duplicate(@Param('id', ParseIntPipe) id: number, @CurrentUser() user) {
    return this.strategiesService.duplicate(id, user.userId, user.role);
  }
}
