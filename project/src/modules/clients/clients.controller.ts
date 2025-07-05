import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('client')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(@Body() createClientDto: CreateClientDto, @CurrentUser() user) {
    // Ensure the client is created for the current user
    return this.clientsService.create({ ...createClientDto, userId: user.userId });
  }

  @Get()
  findAll(@CurrentUser() user, @Query('userId') userId?: string, @Query('strategyId') strategyId?: string) {
    if (userId) {
      const parsedUserId = parseInt(userId, 10);
      if (isNaN(parsedUserId)) {
        throw new HttpException('Invalid userId parameter', HttpStatus.BAD_REQUEST);
      }
      // Only allow viewing other users' clients if admin
      if (user.role !== 'admin' && user.role !== 'super_admin' && user.userId !== parsedUserId) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
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
    
    // Return current user's clients
    return this.clientsService.findByUserId(user.userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user) {
    return this.clientsService.findOne(id, user.userId, user.role);
  }

  @Patch(':id')
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
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user) {
    return this.clientsService.remove(id, user.userId, user.role);
  }
}
