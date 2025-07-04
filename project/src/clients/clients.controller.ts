import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Controller('client')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Get()
  findAll(
    @Query('userId', ParseIntPipe) userId?: number,
    @Query('strategyId', ParseIntPipe) strategyId?: number,
  ) {
    if (userId) {
      return this.clientsService.findByUserId(userId);
    }
    if (strategyId) {
      return this.clientsService.findByStrategyId(strategyId);
    }
    return this.clientsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.update(id, updateClientDto);
  }

  @Post(':id/message')
  appendMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() message: any,
  ) {
    return this.clientsService.appendMessage(id, message);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.remove(id);
  }
}
