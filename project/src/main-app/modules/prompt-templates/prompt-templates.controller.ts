import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { PromptTemplatesService } from './prompt-templates.service';
import { CreatePromptTemplateDto } from './dto/create-prompt-template.dto';
import { UpdatePromptTemplateDto } from './dto/update-prompt-template.dto';
import { JwtAuthGuard } from '../../../shared/auth/auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';

@Controller('admin/prompt-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
export class PromptTemplatesController {
  constructor(private readonly promptTemplatesService: PromptTemplatesService) {}

  @Post()
  create(@Body() createDto: CreatePromptTemplateDto, @Request() req) {
    console.log('Creating prompt template:', { createDto, userId: req.user.userId });
    return this.promptTemplatesService.create(createDto, req.user.userId);
  }

  @Get()
  findAll() {
    return this.promptTemplatesService.findAll();
  }

  @Get('active')
  getActive() {
    return this.promptTemplatesService.getActive();
  }

  @Get('subaccount/:subAccountId')
  findAllForSubAccount(@Param('subAccountId') subAccountId: string) {
    return this.promptTemplatesService.findAllForSubAccount(+subAccountId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.promptTemplatesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdatePromptTemplateDto) {
    console.log('Updating prompt template:', { id, updateDto });
    return this.promptTemplatesService.update(+id, updateDto);
  }

  @Patch(':id/activate')
  activate(@Param('id') id: string, @Body() body: { subAccountId?: number }) {
    if (!body.subAccountId) {
      throw new BadRequestException('subAccountId is required to activate a template');
    }
    return this.promptTemplatesService.activate(+id, body.subAccountId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promptTemplatesService.delete(+id);
  }
} 