import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { WebsiteBuilderService } from './website-builder.service';
import { CreateWebsiteDto } from './dto/create-website.dto';
import { UpdateWebsiteDto } from './dto/update-website.dto';
import { AiEditDto } from './dto/ai-edit.dto';
import { AdminGuard } from '../../../shared/guards/admin.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';

@Controller('website-builder')
@UseGuards(AdminGuard)
export class WebsiteBuilderController {
  private readonly logger = new Logger(WebsiteBuilderController.name);

  constructor(private readonly websiteBuilderService: WebsiteBuilderService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadWebsite(
    @UploadedFiles() files: any[],
    @Body() body: { name: string; description?: string },
    @CurrentUser() user: any,
  ) {
    // Extract admin ID from user object (JWT strategy returns userId, not id)
    const adminId = user.userId || user.id;
    
    if (!adminId) {
      this.logger.error('❌ Admin ID not found in user object');
      throw new BadRequestException('Admin authentication required');
    }

    this.logger.log(`🚀 Upload request received from admin ID: ${adminId} (${user.email})`);
    this.logger.log(`📁 Files received: ${files?.length || 0} files`);
    this.logger.log(`📝 Website name: ${body.name}`);
    this.logger.log(`📄 Description: ${body.description || 'No description'}`);
    
    if (files && files.length > 0) {
      files.forEach((file, index) => {
        this.logger.log(`📄 File ${index + 1}: ${file.originalname} (${file.size} bytes, ${file.mimetype})`);
      });
    }

    if (!files || files.length === 0) {
      this.logger.error('❌ No files uploaded');
      throw new BadRequestException('No files uploaded');
    }

    if (!body.name) {
      this.logger.error('❌ Website name is required');
      throw new BadRequestException('Website name is required');
    }

    this.logger.log(`🔧 Calling website builder service to process upload...`);
    const result = await this.websiteBuilderService.uploadWebsite(files, body.name, adminId, body.description);
    this.logger.log(`✅ Upload completed successfully. Website ID: ${result.website?.id}`);
    
    return result;
  }

  @Post()
  create(@Body() createWebsiteDto: CreateWebsiteDto, @CurrentUser() user: any) {
    const adminId = user.userId || user.id;
    return this.websiteBuilderService.createWebsite(createWebsiteDto, adminId);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    const adminId = user.userId || user.id;
    return this.websiteBuilderService.findAllWebsites(adminId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const adminId = user.userId || user.id;
    return this.websiteBuilderService.findWebsiteById(id, adminId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWebsiteDto: UpdateWebsiteDto,
    @CurrentUser() user: any,
  ) {
    const adminId = user.userId || user.id;
    return this.websiteBuilderService.updateWebsite(id, updateWebsiteDto, adminId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    const adminId = user.userId || user.id;
    return this.websiteBuilderService.deleteWebsite(id, adminId);
  }

  @Post(':id/ai-edit')
  aiEdit(
    @Param('id') id: string,
    @Body() aiEditDto: AiEditDto,
    @CurrentUser() user: any,
  ) {
    const adminId = user.userId || user.id;
    return this.websiteBuilderService.aiEditWebsite(id, aiEditDto, adminId);
  }

  @Get(':id/changes')
  getChangeHistory(@Param('id') id: string, @CurrentUser() user: any) {
    const adminId = user.userId || user.id;
    return this.websiteBuilderService.getChangeHistory(id, adminId);
  }

  @Post(':id/changes/:changeId/revert')
  revertChange(
    @Param('id') id: string,
    @Param('changeId') changeId: string,
    @CurrentUser() user: any,
  ) {
    const adminId = user.userId || user.id;
    return this.websiteBuilderService.revertChange(id, changeId, adminId);
  }

  @Get(':id/build-status')
  getBuildStatus(@Param('id') id: string, @CurrentUser() user: any) {
    const adminId = user.userId || user.id;
    return this.websiteBuilderService.getBuildStatus(id, adminId);
  }

  @Post(':id/stop')
  stopWebsite(@Param('id') id: string, @CurrentUser() user: any) {
    const adminId = user.userId || user.id;
    return this.websiteBuilderService.stopWebsite(id, adminId);
  }

  @Post(':id/restart')
  restartWebsite(@Param('id') id: string, @CurrentUser() user: any) {
    const adminId = user.userId || user.id;
    return this.websiteBuilderService.restartWebsite(id, adminId);
  }
} 