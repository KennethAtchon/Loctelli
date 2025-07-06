import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Admin } from '../../auth/decorators/admin.decorator';
import { AdminGuard } from '../../auth/guards/admin.guard';

@Controller('client')
@UseGuards(AdminGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Admin()
  create(@Body() createClientDto: CreateClientDto, @CurrentUser() user) {
    // Admin users can create clients for any regular user
    return this.clientsService.create(createClientDto);
  }

  @Get()
  @Admin()
  findAll(@CurrentUser() user, @Query('userId') userId?: string, @Query('strategyId') strategyId?: string) {
    if (userId) {
      const parsedUserId = parseInt(userId, 10);
      if (isNaN(parsedUserId)) {
        throw new HttpException('Invalid userId parameter', HttpStatus.BAD_REQUEST);
      }
      return this.clientsService.findByUserId(parsedUserId);
    }
    
    if (strategyId) {
      const parsedStrategyId = parseInt(strategyId, 10);
      if (isNaN(parsedStrategyId)) {
        throw new HttpException('Invalid strategyId parameter', HttpStatus.BAD_REQUEST);
      }
      return this.clientsService.findByStrategyId(parsedStrategyId, user.userId, user.role);
    }
    
    // Admin users can see all clients
    return this.clientsService.findAll();
  }

  @Get(':id')
  @Admin()
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user) {
    return this.clientsService.findOne(id, user.userId, user.role);
  }

  @Patch(':id')
  @Admin()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClientDto: UpdateClientDto,
    @CurrentUser() user
  ) {
    return this.clientsService.update(id, updateClientDto, user.userId, user.role);
  }

  @Post(':id/message')
  appendMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() message: any,
  ) {
    return this.clientsService.appendMessage(id, message);
  }

  @Delete(':id')
  @Admin()
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user) {
    return this.clientsService.remove(id, user.userId, user.role);
  }
}
