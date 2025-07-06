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
    // Admin users can create leads for any regular user within their SubAccounts
    if (user.type === 'admin') {
      // For admin users, subAccountId should be provided in the DTO
      if (!createLeadDto.subAccountId) {
        throw new HttpException('subAccountId is required for lead creation', HttpStatus.BAD_REQUEST);
      }
      return this.leadsService.create(createLeadDto, createLeadDto.subAccountId);
    } else {
      // Regular users can only create leads in their own SubAccount
      return this.leadsService.create(createLeadDto, user.subAccountId);
    }
  }

  @Get()
  @Admin()
  findAll(@CurrentUser() user, @Query('userId') userId?: string, @Query('strategyId') strategyId?: string, @Query('subAccountId') subAccountId?: string) {
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
    
    // Handle SubAccount filtering
    if (user.type === 'admin') {
      // Admin can view leads in specific SubAccount or all their SubAccounts
      const parsedSubAccountId = subAccountId ? parseInt(subAccountId, 10) : undefined;
      if (parsedSubAccountId) {
        return this.leadsService.findAllBySubAccount(parsedSubAccountId);
      } else {
        // Return all leads from all SubAccounts owned by this admin
        return this.leadsService.findAllByAdmin(user.userId);
      }
    } else {
      // Regular users can only view leads in their own SubAccount
      return this.leadsService.findAllBySubAccount(user.subAccountId);
    }
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
