import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Logger
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FormsService } from './forms.service';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { UpdateFormTemplateDto } from './dto/update-form-template.dto';
import { CreateFormSubmissionDto } from './dto/create-form-submission.dto';
import { UpdateFormSubmissionDto } from './dto/update-form-submission.dto';
import { JwtAuthGuard } from '../../../shared/auth/auth.guard';
import { AdminGuard } from '../../../shared/guards/admin.guard';
import { Public } from '../../../shared/decorators/public.decorator';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { isAdminAccount } from '../../../shared/utils';

@Controller('forms')
export class FormsController {
  private readonly logger = new Logger(FormsController.name);

  constructor(private readonly formsService: FormsService) {}

  // Form Templates (Admin only)
  @Post('templates')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async createFormTemplate(
    @Body() createFormTemplateDto: CreateFormTemplateDto,
    @CurrentUser() user: any
  ) {
    try {
      this.logger.debug(`Creating form template for user: ${user.userId}`);
      this.logger.debug(`Form template data: ${JSON.stringify(createFormTemplateDto)}`);

      const result = await this.formsService.createFormTemplate(createFormTemplateDto, user.userId);

      this.logger.debug(`Form template created successfully`);
      return result;
    } catch (error) {
      this.logger.error(`Error in createFormTemplate controller: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('templates')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async findAllFormTemplates(@Query('subAccountId') subAccountId?: string) {
    try {
      this.logger.debug(`Getting form templates with subAccountId: ${subAccountId}`);
      const subAccountIdNum = subAccountId ? parseInt(subAccountId, 10) : undefined;
      this.logger.debug(`Parsed subAccountId: ${subAccountIdNum}`);

      const result = await this.formsService.findAllFormTemplates(subAccountIdNum);
      this.logger.debug(`Found ${result.length} form templates`);

      return result;
    } catch (error) {
      this.logger.error(`Error getting form templates: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('templates/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findFormTemplateById(@Param('id') id: string) {
    return this.formsService.findFormTemplateById(id);
  }

  @Patch('templates/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateFormTemplate(
    @Param('id') id: string,
    @Body() updateFormTemplateDto: UpdateFormTemplateDto
  ) {
    return this.formsService.updateFormTemplate(id, updateFormTemplateDto);
  }

  @Delete('templates/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  removeFormTemplate(@Param('id') id: string) {
    return this.formsService.removeFormTemplate(id);
  }

  // Public endpoints - ordered by specificity (most specific first)

  // Database wake-up endpoint (public)
  @Get('public/wake-up')
  @Public()
  wakeUpDatabase() {
    return this.formsService.wakeUpDatabase();
  }

  // File upload endpoint for forms (specific path before parameterized)
  @Post('public/:slug/upload')
  @Public()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('slug') slug: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('fieldId') fieldId: string
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!fieldId) {
      throw new BadRequestException('Field ID is required');
    }

    return this.formsService.uploadFormFile(slug, fieldId, file);
  }

  // Public form submission (specific path before parameterized)
  @Post('public/:slug/submit')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async submitForm(
    @Param('slug') slug: string,
    @Body() submissionData: any,
    @Req() req: any
  ) {
    // Get form template to validate and get subAccountId
    const template = await this.formsService.findFormTemplateBySlug(slug);

    if (!template.subAccountId) {
      throw new BadRequestException('Form template must be associated with a sub-account');
    }

    const createFormSubmissionDto: CreateFormSubmissionDto = {
      formTemplateId: slug, // Service will resolve this to the actual template ID
      data: submissionData.data || submissionData,
      files: submissionData.files,
      source: submissionData.source || 'website',
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent')
    };

    return this.formsService.createFormSubmission(createFormSubmissionDto, template.subAccountId);
  }

  // Public form access (by slug) - parameterized route last
  @Get('public/:slug')
  @Public()
  findFormTemplateBySlug(@Param('slug') slug: string) {
    return this.formsService.findFormTemplateBySlug(slug);
  }

  // Form Submissions (Admin/User access)
  @Get('submissions')
  @UseGuards(JwtAuthGuard)
  findAllFormSubmissions(
    @CurrentUser() user: any,
    @Query('subAccountId') subAccountId?: string,
    @Query('formTemplateId') formTemplateId?: string,
    @Query('status') status?: string
  ) {
    // Admin users can view all submissions with optional subAccountId filter
    // Regular users can only view their own subAccount submissions
    let subAccountIdNum: number | undefined;

    if (isAdminAccount(user)) {
      // Admin can optionally filter by subAccountId, or see all if no filter
      subAccountIdNum = subAccountId ? parseInt(subAccountId, 10) : undefined;
    } else {
      // Regular users can only see their own subAccount
      subAccountIdNum = user.subAccountId;
    }

    return this.formsService.findAllFormSubmissions(subAccountIdNum, formTemplateId, status);
  }

  @Get('submissions/:id')
  @UseGuards(JwtAuthGuard)
  findFormSubmissionById(@Param('id') id: string) {
    return this.formsService.findFormSubmissionById(id);
  }

  @Patch('submissions/:id')
  @UseGuards(JwtAuthGuard)
  updateFormSubmission(
    @Param('id') id: string,
    @Body() updateFormSubmissionDto: UpdateFormSubmissionDto
  ) {
    return this.formsService.updateFormSubmission(id, updateFormSubmissionDto);
  }

  @Delete('submissions/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  removeFormSubmission(@Param('id') id: string) {
    return this.formsService.removeFormSubmission(id);
  }

}