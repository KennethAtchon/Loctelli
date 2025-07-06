import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Admin } from '../../auth/decorators/admin.decorator';
import { AdminGuard } from '../../auth/guards/admin.guard';

@Controller('lead')
@UseGuards(AdminGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @Admin()
  create(@Body() createLeadDto: CreateLeadDto, @CurrentUser() user) {
    // Admin users can create leads for any regular user
    return this.leadsService.create(createLeadDto);
  }

  @Get()
  @Admin()
  findAll(@CurrentUser() user, @Query('userId') userId?: string, @Query('strategyId') strategyId?: string) {
    if (userId) {
      const parsedUserId = parseInt(userId, 10);
      if (isNaN(parsedUserId)) {
        throw new HttpException('Invalid userId parameter', HttpStatus.BAD_REQUEST);
      }
      return this.leadsService.findByUserId(parsedUserId);
    }
    
    if (strategyId) {
      const parsedStrategyId = parseInt(strategyId, 10);
      if (isNaN(parsedStrategyId)) {
        throw new HttpException('Invalid strategyId parameter', HttpStatus.BAD_REQUEST);
      }
      return this.leadsService.findByStrategyId(parsedStrategyId, user.userId, user.role);
    }
    
    // Admin users can see all leads
    return this.leadsService.findAll();
  }

  @Get(':id')
  @Admin()
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user) {
    return this.leadsService.findOne(id, user.userId, user.role);
  }

  @Patch(':id')
  @Admin()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLeadDto: UpdateLeadDto,
    @CurrentUser() user
  ) {
    return this.leadsService.update(id, updateLeadDto, user.userId, user.role);
  }

  @Post(':id/message')
  appendMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() message: any,
  ) {
    return this.leadsService.appendMessage(id, message);
  }

  @Delete(':id')
  @Admin()
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user) {
    return this.leadsService.remove(id, user.userId, user.role);
  }
}
