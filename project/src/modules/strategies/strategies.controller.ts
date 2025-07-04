import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { StrategiesService } from './strategies.service';
import { CreateStrategyDto } from './dto/create-strategy.dto';
import { UpdateStrategyDto } from './dto/update-strategy.dto';

@Controller('strategy')
export class StrategiesController {
  constructor(private readonly strategiesService: StrategiesService) {}

  @Post()
  create(@Body() createStrategyDto: CreateStrategyDto) {
    return this.strategiesService.create(createStrategyDto);
  }

  @Get()
  findAll(@Query('userId', ParseIntPipe) userId?: number) {
    if (userId) {
      return this.strategiesService.findByUserId(userId);
    }
    return this.strategiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.strategiesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStrategyDto: UpdateStrategyDto,
  ) {
    return this.strategiesService.update(id, updateStrategyDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.strategiesService.remove(id);
  }
}
