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
  UploadedFiles
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

@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  // Form Templates (Admin only)
  @Post('templates')
  @UseGuards(JwtAuthGuard, AdminGuard)
  createFormTemplate(
    @Body() createFormTemplateDto: CreateFormTemplateDto,
    @CurrentUser() user: any
  ) {
    return this.formsService.createFormTemplate(createFormTemplateDto, user.userId);
  }

  @Get('templates')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAllFormTemplates(@Query('subAccountId') subAccountId?: string) {
    const subAccountIdNum = subAccountId ? parseInt(subAccountId, 10) : undefined;
    return this.formsService.findAllFormTemplates(subAccountIdNum);
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

  // Public form access (by slug)
  @Get('public/:slug')
  @Public()
  findFormTemplateBySlug(@Param('slug') slug: string) {
    return this.formsService.findFormTemplateBySlug(slug);
  }

  // Public form submission
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

  // Database wake-up endpoint (public)
  @Get('public/wake-up')
  @Public()
  wakeUpDatabase() {
    return this.formsService.wakeUpDatabase();
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

    if (user.type === 'admin') {
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

  // File upload endpoint for forms
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
}