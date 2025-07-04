import { Controller, Get, Post, Body } from '@nestjs/common';

@Controller('general')
export class GeneralController {
  constructor() {}

  @Get()
  generalGet() {
    return { message: 'General GET endpoint is working!' };
  }

  @Post()
  generalPost(@Body() data: any) {
    return { received: data };
  }
}
