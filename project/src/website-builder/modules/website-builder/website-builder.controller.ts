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
        
        // Additional debug info for ZIP files
        if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed' || file.originalname.endsWith('.zip')) {
          this.logger.log(`📦 ZIP file detected: ${file.originalname}`);
          this.logger.log(`📦 ZIP buffer size: ${file.buffer.length} bytes`);
          this.logger.log(`📦 ZIP buffer type: ${typeof file.buffer}`);
        }
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

  @Get(':id/debug')
  async debugWebsite(@Param('id') id: string, @CurrentUser() user: any) {
    const adminId = user.userId || user.id;
    const website = await this.websiteBuilderService.findWebsiteById(id, adminId);
    
    // Get files from the relation
    const files = await this.websiteBuilderService.getWebsiteFiles(id, adminId);
    
    const debugInfo = {
      ...website,
      debug: {
        fileCount: files.length,
        fileNames: files.map(f => f.name) || [],
        fileTypes: files.map(f => ({ name: f.name, type: f.type, size: f.size })) || [],
        htmlFiles: files.filter(f => f.name.toLowerCase().endsWith('.html') || f.name.toLowerCase().endsWith('.htm')) || [],
        hasPackageJson: files.some(f => f.name === 'package.json') || false,
        hasViteConfig: files.some(f => f.name.includes('vite.config')) || false,
        totalContentSize: files.reduce((sum, f) => sum + f.size, 0) || 0
      }
    };
    
    return debugInfo;
  }

  @Get(':id/preview')
  async previewWebsite(@Param('id') id: string, @CurrentUser() user: any) {
    const adminId = user.userId || user.id;
    const website = await this.websiteBuilderService.findWebsiteById(id, adminId);
    const files = await this.websiteBuilderService.getWebsiteFiles(id, adminId);
    
    // Find the main HTML file
    const htmlFile = files.find(file => 
      file.name.toLowerCase().endsWith('.html') && 
      (file.name.toLowerCase() === 'index.html' || file.name.toLowerCase() === 'main.html')
    ) || files.find(file => file.name.toLowerCase().endsWith('.html'));

    if (!htmlFile) {
      throw new BadRequestException('No HTML file found for preview');
    }

    // Get the HTML content from R2
    const htmlContent = await this.websiteBuilderService.getFileContent(id, htmlFile.path, adminId);
    
    return {
      website,
      htmlContent: htmlContent.toString('utf8'),
      htmlFile: htmlFile.name,
    };
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