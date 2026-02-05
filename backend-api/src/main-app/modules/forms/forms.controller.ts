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
  Logger,
  Request,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { FormsService } from './forms.service';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { UpdateFormTemplateDto } from './dto/update-form-template.dto';
import { CreateFormSubmissionDto } from './dto/create-form-submission.dto';
import { UpdateFormSubmissionDto } from './dto/update-form-submission.dto';
import { CreateFormSessionDto } from './dto/create-form-session.dto';
import { UpdateFormSessionDto } from './dto/update-form-session.dto';
import { ProfileEstimationAIService } from './services/profile-estimation-ai.service';
import { FormAnalyticsService } from './services/form-analytics.service';
import { JwtAuthGuard } from '../../../shared/auth/auth.guard';
import { AdminGuard } from '../../../shared/guards/admin.guard';
import { Public } from '../../../shared/decorators/public.decorator';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { isAdminAccount } from '../../../shared/utils';

@Controller('forms')
export class FormsController {
  private readonly logger = new Logger(FormsController.name);

  constructor(
    private readonly formsService: FormsService,
    private readonly profileEstimationAI: ProfileEstimationAIService,
    private readonly formAnalytics: FormAnalyticsService,
  ) {}

  // Form Templates (Admin only)
  @Post('templates')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async createFormTemplate(
    @Body() createFormTemplateDto: CreateFormTemplateDto,
    @CurrentUser() user: any,
  ) {
    try {
      this.logger.debug(`Creating form template for user: ${user.userId}`);
      this.logger.debug(
        `Form template data: ${JSON.stringify(createFormTemplateDto)}`,
      );

      const result = await this.formsService.createFormTemplate(
        createFormTemplateDto,
        user.userId,
      );

      this.logger.debug(`Form template created successfully`);
      return result;
    } catch (error) {
      this.logger.error(
        `Error in createFormTemplate controller: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get('templates')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async findAllFormTemplates(@Query('subAccountId') subAccountId?: string) {
    try {
      this.logger.debug(
        `Getting form templates with subAccountId: ${subAccountId}`,
      );
      const subAccountIdNum = subAccountId
        ? parseInt(subAccountId, 10)
        : undefined;
      this.logger.debug(`Parsed subAccountId: ${subAccountIdNum}`);

      const result =
        await this.formsService.findAllFormTemplates(subAccountIdNum);
      this.logger.debug(`Found ${result.length} form templates`);

      return result;
    } catch (error) {
      this.logger.error(
        `Error getting form templates: ${error.message}`,
        error.stack,
      );
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
    @Body() updateFormTemplateDto: UpdateFormTemplateDto,
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

  // Admin file upload endpoint for form media/assets
  @Post('templates/:slug/upload')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadAdminFile(
    @Param('slug') slug: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('fieldId') fieldId: string,
    @CurrentUser() user: any,
  ) {
    const startTime = Date.now();
    this.logger.log(
      `[ADMIN] File upload request received - slug: ${slug}, fieldId: ${fieldId}, userId: ${user?.sub || 'unknown'}, email: ${user?.email || 'unknown'}`,
    );

    if (!file) {
      this.logger.warn(
        `[ADMIN] File upload failed - no file provided - slug: ${slug}, fieldId: ${fieldId}, userId: ${user?.sub || 'unknown'}`,
      );
      throw new BadRequestException('No file provided');
    }

    if (!fieldId) {
      this.logger.warn(
        `[ADMIN] File upload failed - fieldId missing - slug: ${slug}, fileName: ${file.originalname}, userId: ${user?.sub || 'unknown'}`,
      );
      throw new BadRequestException('Field ID is required');
    }

    this.logger.debug(
      `[ADMIN] File upload validation passed - slug: ${slug}, fieldId: ${fieldId}, fileName: ${file.originalname}, size: ${file.size} bytes, mimeType: ${file.mimetype}`,
    );

    try {
      const result = await this.formsService.uploadAdminMediaFile(
        slug,
        fieldId,
        file,
      );
      const duration = Date.now() - startTime;
      this.logger.log(
        `[ADMIN] File upload completed successfully - slug: ${slug}, fieldId: ${fieldId}, key: ${result.key}, url: ${result.url}, duration: ${duration}ms`,
      );
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `[ADMIN] File upload failed - slug: ${slug}, fieldId: ${fieldId}, fileName: ${file.originalname}, error: ${error.message}, duration: ${duration}ms`,
      );
      throw error;
    }
  }

  // File upload endpoint for forms (specific path before parameterized)
  @Post('public/:slug/upload')
  @Public()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('slug') slug: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('fieldId') fieldId: string,
    @Req() req: Request,
  ) {
    const startTime = Date.now();
    const clientIp =
      (req as any).ip ||
      (req as any).socket?.remoteAddress ||
      req.headers['x-forwarded-for'] ||
      'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    this.logger.log(
      `[PUBLIC] File upload request received - slug: ${slug}, fieldId: ${fieldId}, clientIp: ${clientIp}, userAgent: ${userAgent.substring(0, 100)}`,
    );

    if (!file) {
      this.logger.warn(
        `[PUBLIC] File upload failed - no file provided - slug: ${slug}, fieldId: ${fieldId}, clientIp: ${clientIp}`,
      );
      throw new BadRequestException('No file provided');
    }

    if (!fieldId) {
      this.logger.warn(
        `[PUBLIC] File upload failed - fieldId missing - slug: ${slug}, fileName: ${file.originalname}, clientIp: ${clientIp}`,
      );
      throw new BadRequestException('Field ID is required');
    }

    this.logger.debug(
      `[PUBLIC] File upload validation passed - slug: ${slug}, fieldId: ${fieldId}, fileName: ${file.originalname}, size: ${file.size} bytes, mimeType: ${file.mimetype}`,
    );

    try {
      const result = await this.formsService.uploadFormFile(
        slug,
        fieldId,
        file,
      );
      const duration = Date.now() - startTime;
      this.logger.log(
        `[PUBLIC] File upload completed successfully - slug: ${slug}, fieldId: ${fieldId}, key: ${result.key}, url: ${result.url}, duration: ${duration}ms`,
      );
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `[PUBLIC] File upload failed - slug: ${slug}, fieldId: ${fieldId}, fileName: ${file.originalname}, error: ${error.message}, clientIp: ${clientIp}, duration: ${duration}ms`,
      );
      throw error;
    }
  }

  // Form session (card form save/resume) - before generic GET public/:slug
  @Post('public/:slug/session')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async createFormSession(
    @Param('slug') slug: string,
    @Body() dto: CreateFormSessionDto,
  ) {
    return this.formsService.createFormSession(slug, dto);
  }

  @Get('public/:slug/session/:token')
  @Public()
  async getFormSession(
    @Param('slug') slug: string,
    @Param('token') token: string,
  ) {
    return this.formsService.getFormSessionByToken(slug, token);
  }

  @Patch('public/:slug/session/:token')
  @Public()
  async updateFormSession(
    @Param('slug') slug: string,
    @Param('token') token: string,
    @Body() dto: UpdateFormSessionDto,
  ) {
    return this.formsService.updateFormSession(slug, token, dto);
  }

  @Post('public/:slug/session/:token/complete')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  async completeFormSession(
    @Param('slug') slug: string,
    @Param('token') token: string,
  ) {
    await this.formsService.completeFormSession(slug, token);
  }

  // Public form submission (specific path before parameterized)
  @Post('public/:slug/submit')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async submitForm(
    @Param('slug') slug: string,
    @Body() submissionData: any,
    @Req() req: any,
  ) {
    // Get form template to validate and get subAccountId
    const template = await this.formsService.findFormTemplateBySlug(slug);

    if (!template.subAccountId) {
      throw new BadRequestException(
        'Form template must be associated with a sub-account',
      );
    }

    const createFormSubmissionDto: CreateFormSubmissionDto = {
      formTemplateId: slug, // Service will resolve this to the actual template ID
      data: submissionData.data || submissionData,
      files: submissionData.files,
      source: submissionData.source || 'website',
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent'),
    };

    return this.formsService.createFormSubmission(
      createFormSubmissionDto,
      template.subAccountId,
    );
  }

  // Profile estimation with AI enhancement
  @Post('public/:slug/calculate-profile')
  @Public()
  async calculateProfileEstimation(
    @Param('slug') slug: string,
    @Body() body: { answers: Record<string, unknown> },
  ) {
    const template = await this.formsService.findFormTemplateBySlug(slug);

    if (
      !template.profileEstimation ||
      !(template.profileEstimation as any).enabled
    ) {
      throw new BadRequestException(
        'Profile estimation is not enabled for this form',
      );
    }

    return this.formsService.calculateProfileEstimation(slug, body.answers);
  }

  // Analytics endpoints
  @Get('templates/:id/analytics')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getFormAnalytics(@Param('id') id: string) {
    return this.formAnalytics.getFormAnalytics(id);
  }

  @Post('public/:slug/track-time')
  @Public()
  async trackCardTime(
    @Param('slug') slug: string,
    @Body() body: { sessionToken: string; cardId: string; timeSeconds: number },
  ) {
    await this.formAnalytics.updateTimePerCard(
      body.sessionToken,
      body.cardId,
      body.timeSeconds,
    );
    return { success: true };
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
    @Query('status') status?: string,
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

    return this.formsService.findAllFormSubmissions(
      subAccountIdNum,
      formTemplateId,
      status,
    );
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
    @Body() updateFormSubmissionDto: UpdateFormSubmissionDto,
  ) {
    return this.formsService.updateFormSubmission(id, updateFormSubmissionDto);
  }

  @Delete('submissions/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  removeFormSubmission(@Param('id') id: string) {
    return this.formsService.removeFormSubmission(id);
  }
}
