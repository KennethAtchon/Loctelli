import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import type { Express } from 'express';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { R2StorageService } from '../../../shared/storage/r2-storage.service';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { UpdateFormTemplateDto } from './dto/update-form-template.dto';
import { CreateFormSubmissionDto } from './dto/create-form-submission.dto';
import { UpdateFormSubmissionDto } from './dto/update-form-submission.dto';
import { CreateFormSessionDto } from './dto/create-form-session.dto';
import { UpdateFormSessionDto } from './dto/update-form-session.dto';
import { ProfileEstimationAIService } from './services/profile-estimation-ai.service';
import { randomUUID } from 'node:crypto';

@Injectable()
export class FormsService {
  private readonly logger = new Logger(FormsService.name);

  constructor(
    private prisma: PrismaService,
    private r2StorageService: R2StorageService,
    private profileEstimationAI: ProfileEstimationAIService,
  ) {}

  // Form Templates
  async createFormTemplate(
    createFormTemplateDto: CreateFormTemplateDto,
    adminId: number,
  ) {
    try {
      this.logger.debug(
        `Creating form template with slug: ${createFormTemplateDto.slug}`,
      );
      const { slug, subAccountId, ...data } = createFormTemplateDto;

      // Check if slug already exists
      this.logger.debug(`Checking if slug '${slug}' already exists`);
      const existingTemplate = await this.prisma.formTemplate.findUnique({
        where: { slug },
      });

      if (existingTemplate) {
        throw new ConflictException(
          `Form template with slug '${slug}' already exists`,
        );
      }

      // If no subAccountId provided, use the default SubAccount
      let finalSubAccountId = subAccountId;
      if (!finalSubAccountId) {
        this.logger.debug(
          'No subAccountId provided, looking for default SubAccount',
        );
        const defaultSubAccount = await this.prisma.subAccount.findFirst({
          where: { name: 'Default SubAccount' },
        });

        if (!defaultSubAccount) {
          throw new BadRequestException(
            'No default SubAccount available for form template creation',
          );
        }

        finalSubAccountId = defaultSubAccount.id;
        this.logger.debug(`Using default SubAccount ID: ${finalSubAccountId}`);
      }

      this.logger.debug(
        `Creating form template with subAccountId: ${finalSubAccountId}`,
      );
      const result = await this.prisma.formTemplate.create({
        data: {
          ...data,
          slug,
          createdByAdminId: adminId,
          subAccountId: finalSubAccountId,
          schema: JSON.parse(
            JSON.stringify(data.schema),
          ) as Prisma.InputJsonValue,
          cardSettings: data.cardSettings as Prisma.InputJsonValue | undefined,
          profileEstimation: data.profileEstimation as
            | Prisma.InputJsonValue
            | undefined,
          styling: data.styling as Prisma.InputJsonValue | undefined,
        },
      });

      this.logger.debug(
        `Form template created successfully with ID: ${result.id}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error creating form template: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findAllFormTemplates(subAccountId?: number) {
    try {
      this.logger.debug(
        `Finding form templates with subAccountId: ${subAccountId}`,
      );

      // If no subAccountId provided, return all templates
      const whereClause = subAccountId ? { subAccountId } : {};
      this.logger.debug(`Where clause: ${JSON.stringify(whereClause)}`);

      const result = await this.prisma.formTemplate.findMany({
        where: whereClause,
        include: {
          createdByAdmin: {
            select: { id: true, name: true, email: true },
          },
          subAccount: {
            select: { id: true, name: true },
          },
          _count: {
            select: { submissions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      this.logger.debug(`Found ${result.length} form templates`);
      this.logger.debug(
        `Template details: ${JSON.stringify(result.map((t) => ({ id: t.id, name: t.name, slug: t.slug, subAccountId: t.subAccountId })))}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error finding form templates: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findFormTemplateById(id: string) {
    const template = await this.prisma.formTemplate.findUnique({
      where: { id },
      include: {
        createdByAdmin: {
          select: { id: true, name: true, email: true },
        },
        subAccount: {
          select: { id: true, name: true },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`Form template with ID ${id} not found`);
    }

    return template;
  }

  async findFormTemplateBySlug(slug: string) {
    const template = await this.prisma.formTemplate.findUnique({
      where: { slug },
      include: {
        subAccount: {
          select: { id: true, name: true },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(
        `Form template with slug '${slug}' not found`,
      );
    }

    if (!template.isActive) {
      throw new BadRequestException(`Form template '${slug}' is not active`);
    }

    return template;
  }

  async updateFormTemplate(
    id: string,
    updateFormTemplateDto: UpdateFormTemplateDto,
  ) {
    const template = await this.findFormTemplateById(id);

    // Check if slug is being changed and if it conflicts
    if (
      updateFormTemplateDto.slug &&
      updateFormTemplateDto.slug !== template.slug
    ) {
      const existingTemplate = await this.prisma.formTemplate.findUnique({
        where: { slug: updateFormTemplateDto.slug },
      });

      if (existingTemplate) {
        throw new ConflictException(
          `Form template with slug '${updateFormTemplateDto.slug}' already exists`,
        );
      }
    }

    // Prepare update data, excluding subAccountId and properly converting schema
    const { subAccountId, schema, ...updateData } = updateFormTemplateDto;
    const data: any = { ...updateData };

    // Convert schema to JSON if provided
    if (schema) {
      data.schema = JSON.parse(JSON.stringify(schema));
    }

    return this.prisma.formTemplate.update({
      where: { id },
      data,
    });
  }

  async removeFormTemplate(id: string) {
    await this.findFormTemplateById(id);

    return this.prisma.formTemplate.delete({
      where: { id },
    });
  }

  // Form Submissions
  async createFormSubmission(
    createFormSubmissionDto: CreateFormSubmissionDto,
    subAccountId: number,
  ) {
    const { formTemplateId, ...data } = createFormSubmissionDto;

    // Verify form template exists and is active
    const template = await this.findFormTemplateBySlug(formTemplateId);

    return this.prisma.formSubmission.create({
      data: {
        ...data,
        formTemplateId: template.id,
        subAccountId,
      },
    });
  }

  findAllFormSubmissions(
    subAccountId?: number,
    formTemplateId?: string,
    status?: string,
  ) {
    const where: any = {};

    if (subAccountId) {
      where.subAccountId = subAccountId;
    }

    if (formTemplateId) {
      where.formTemplateId = formTemplateId;
    }

    if (status) {
      where.status = status;
    }

    return this.prisma.formSubmission.findMany({
      where,
      include: {
        formTemplate: {
          select: { id: true, name: true, title: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        subAccount: {
          select: { id: true, name: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async findFormSubmissionById(id: string) {
    const submission = await this.prisma.formSubmission.findUnique({
      where: { id },
      include: {
        formTemplate: {
          select: { id: true, name: true, title: true, schema: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        subAccount: {
          select: { id: true, name: true },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException(`Form submission with ID ${id} not found`);
    }

    return submission;
  }

  async updateFormSubmission(
    id: string,
    updateFormSubmissionDto: UpdateFormSubmissionDto,
  ) {
    await this.findFormSubmissionById(id);

    const updateData: any = { ...updateFormSubmissionDto };

    // Update reviewed/contacted timestamps based on status
    if (updateFormSubmissionDto.status) {
      if (
        updateFormSubmissionDto.status === 'reviewed' &&
        !updateData.reviewedAt
      ) {
        updateData.reviewedAt = new Date();
      }
      if (
        updateFormSubmissionDto.status === 'contacted' &&
        !updateData.contactedAt
      ) {
        updateData.contactedAt = new Date();
      }
    }

    return this.prisma.formSubmission.update({
      where: { id },
      data: updateData,
    });
  }

  async removeFormSubmission(id: string) {
    await this.findFormSubmissionById(id);

    return this.prisma.formSubmission.delete({
      where: { id },
    });
  }

  // Form sessions (card form save/resume)
  async createFormSession(slug: string, dto: CreateFormSessionDto) {
    const template = await this.findFormTemplateBySlug(slug);
    if (template.formType !== 'CARD') {
      throw new BadRequestException(
        'Form sessions are only supported for card forms',
      );
    }
    if (!template.subAccountId) {
      throw new BadRequestException(
        'Form template must be associated with a sub-account',
      );
    }
    const sessionToken = randomUUID();
    const session = await this.prisma.formSession.create({
      data: {
        formTemplateId: template.id,
        subAccountId: template.subAccountId,
        sessionToken,
        currentCardIndex: 0,
        partialData: {} as Prisma.InputJsonValue,
        deviceType: dto.deviceType,
        browser: dto.browser,
        os: dto.os,
      },
    });
    return {
      sessionToken: session.sessionToken,
      currentCardIndex: session.currentCardIndex,
      partialData: session.partialData as Record<string, unknown>,
      formTemplateId: session.formTemplateId,
    };
  }

  async getFormSessionByToken(slug: string, token: string) {
    const template = await this.findFormTemplateBySlug(slug);
    const session = await this.prisma.formSession.findUnique({
      where: { sessionToken: token },
      include: { formTemplate: { select: { slug: true } } },
    });
    if (!session || session.formTemplate.slug !== slug) {
      throw new NotFoundException('Form session not found or expired');
    }
    if (session.completedAt) {
      throw new BadRequestException('This session has already been completed');
    }
    return {
      sessionToken: session.sessionToken,
      currentCardIndex: session.currentCardIndex,
      partialData: session.partialData as Record<string, unknown>,
      formTemplateId: session.formTemplateId,
    };
  }

  async updateFormSession(
    slug: string,
    token: string,
    dto: UpdateFormSessionDto,
  ) {
    const template = await this.findFormTemplateBySlug(slug);
    const session = await this.prisma.formSession.findUnique({
      where: { sessionToken: token },
      include: { formTemplate: { select: { slug: true } } },
    });
    if (!session || session.formTemplate.slug !== slug) {
      throw new NotFoundException('Form session not found or expired');
    }
    if (session.completedAt) {
      throw new BadRequestException('This session has already been completed');
    }
    const updateData: {
      currentCardIndex?: number;
      partialData?: Prisma.InputJsonValue;
    } = {};
    if (dto.currentCardIndex !== undefined) {
      updateData.currentCardIndex = dto.currentCardIndex;
    }
    if (dto.partialData !== undefined) {
      updateData.partialData = dto.partialData as Prisma.InputJsonValue;
    }
    const updated = await this.prisma.formSession.update({
      where: { id: session.id },
      data: updateData,
    });
    return {
      sessionToken: updated.sessionToken,
      currentCardIndex: updated.currentCardIndex,
      partialData: updated.partialData as Record<string, unknown>,
      formTemplateId: updated.formTemplateId,
    };
  }

  async completeFormSession(slug: string, token: string) {
    const template = await this.findFormTemplateBySlug(slug);
    const session = await this.prisma.formSession.findUnique({
      where: { sessionToken: token },
      include: { formTemplate: { select: { slug: true } } },
    });
    if (!session || session.formTemplate.slug !== slug) {
      throw new NotFoundException('Form session not found or expired');
    }
    await this.prisma.formSession.update({
      where: { id: session.id },
      data: { completedAt: new Date() },
    });
  }

  // Utility method for database wake-up
  async wakeUpDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'awake', timestamp: new Date() };
    } catch (error) {
      throw new BadRequestException('Failed to wake up database');
    }
  }

  // Admin file upload for media/assets (no field validation required)
  async uploadAdminMediaFile(
    slug: string,
    fieldId: string,
    file: Express.Multer.File,
  ) {
    const startTime = Date.now();
    this.logger.log(
      `[ADMIN MEDIA] Starting admin media upload - slug: ${slug}, fieldId: ${fieldId}, fileName: ${file.originalname}, size: ${file.size} bytes, mimeType: ${file.mimetype}`,
    );

    // Check R2 storage availability
    if (!this.r2StorageService.isEnabled()) {
      this.logger.error(
        `[ADMIN MEDIA] File upload failed - R2 storage is disabled for slug: ${slug}, fieldId: ${fieldId}`,
      );
      throw new BadRequestException(
        'File upload is not available - R2 storage is disabled',
      );
    }

    this.logger.debug(`[ADMIN MEDIA] R2 storage check passed for slug: ${slug}`);

    // Verify form template exists (but don't validate field)
    let template;
    try {
      template = await this.findFormTemplateBySlug(slug);
      this.logger.debug(
        `[ADMIN MEDIA] Form template found - slug: ${slug}, templateId: ${template.id}`,
      );
    } catch (error) {
      this.logger.error(
        `[ADMIN MEDIA] Form template not found - slug: ${slug}, error: ${error.message}`,
      );
      throw error;
    }

    // Validate file type (images only for media uploads)
    if (!file.mimetype.startsWith('image/')) {
      this.logger.error(
        `[ADMIN MEDIA] Invalid file type for media upload - slug: ${slug}, fieldId: ${fieldId}, fileMimeType: ${file.mimetype}`,
      );
      throw new BadRequestException(
        'Only image files are allowed for media uploads',
      );
    }

    this.logger.debug(
      `[ADMIN MEDIA] File validation passed - slug: ${slug}, fieldId: ${fieldId}`,
    );

    try {
      // Generate unique file key
      const timestamp = Date.now();
      const fileExtension = file.originalname.split('.').pop() || '';
      const key = `forms/${slug}/media/${fieldId}/${timestamp}.${fileExtension}`;

      this.logger.log(
        `[ADMIN MEDIA] Uploading file to R2 - slug: ${slug}, fieldId: ${fieldId}, key: ${key}, size: ${file.size} bytes`,
      );

      const uploadStartTime = Date.now();
      // Upload to R2
      const url = await this.r2StorageService.uploadFile(
        key,
        file.buffer,
        file.mimetype,
      );
      const uploadDuration = Date.now() - uploadStartTime;

      const totalDuration = Date.now() - startTime;
      this.logger.log(
        `[ADMIN MEDIA] File upload successful - slug: ${slug}, fieldId: ${fieldId}, key: ${key}, url: ${url}, uploadDuration: ${uploadDuration}ms, totalDuration: ${totalDuration}ms`,
      );

      return {
        url,
        key,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      this.logger.error(
        `[ADMIN MEDIA] File upload failed - slug: ${slug}, fieldId: ${fieldId}, fileName: ${file.originalname}, error: ${error.message}, stack: ${error.stack}, duration: ${totalDuration}ms`,
      );
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  // File upload for forms
  async uploadFormFile(
    slug: string,
    fieldId: string,
    file: Express.Multer.File,
  ) {
    const startTime = Date.now();
    this.logger.log(
      `Starting file upload - slug: ${slug}, fieldId: ${fieldId}, fileName: ${file.originalname}, size: ${file.size} bytes, mimeType: ${file.mimetype}`,
    );

    // Check R2 storage availability
    if (!this.r2StorageService.isEnabled()) {
      this.logger.error(
        `File upload failed - R2 storage is disabled for slug: ${slug}, fieldId: ${fieldId}`,
      );
      throw new BadRequestException(
        'File upload is not available - R2 storage is disabled',
      );
    }

    this.logger.debug(`R2 storage check passed for slug: ${slug}`);

    // Verify form template exists
    let template;
    try {
      template = await this.findFormTemplateBySlug(slug);
      this.logger.debug(
        `Form template found - slug: ${slug}, templateId: ${template.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Form template not found - slug: ${slug}, error: ${error.message}`,
      );
      throw error;
    }

    // Verify field exists and is a file/image field
    if (!template.schema || !Array.isArray(template.schema)) {
      this.logger.error(
        `Invalid form template schema - slug: ${slug}, templateId: ${template.id}`,
      );
      throw new BadRequestException('Form template schema is invalid');
    }

    const schema = template.schema as any[];
    const field = schema.find((f: any) => f.id === fieldId);
    if (!field) {
      this.logger.error(
        `Field not found in template - slug: ${slug}, fieldId: ${fieldId}, availableFields: ${schema.map((f) => f.id).join(', ')}`,
      );
      throw new BadRequestException(
        `Field '${fieldId}' not found in form template`,
      );
    }

    this.logger.debug(
      `Field found - slug: ${slug}, fieldId: ${fieldId}, fieldType: ${field.type}`,
    );

    if (field.type !== 'file' && field.type !== 'image') {
      this.logger.error(
        `Invalid field type for upload - slug: ${slug}, fieldId: ${fieldId}, fieldType: ${field.type}, expected: file or image`,
      );
      throw new BadRequestException(
        `Field '${fieldId}' is not a file upload field`,
      );
    }

    // Validate file type for image fields
    if (field.type === 'image' && !file.mimetype.startsWith('image/')) {
      this.logger.error(
        `Invalid file type for image field - slug: ${slug}, fieldId: ${fieldId}, fileMimeType: ${file.mimetype}`,
      );
      throw new BadRequestException(
        'Only image files are allowed for this field',
      );
    }

    this.logger.debug(
      `File validation passed - slug: ${slug}, fieldId: ${fieldId}, fieldType: ${field.type}`,
    );

    try {
      // Generate unique file key
      const timestamp = Date.now();
      const fileExtension = file.originalname.split('.').pop() || '';
      const key = `forms/${slug}/${fieldId}/${timestamp}.${fileExtension}`;

      this.logger.log(
        `Uploading file to R2 - slug: ${slug}, fieldId: ${fieldId}, key: ${key}, size: ${file.size} bytes`,
      );

      const uploadStartTime = Date.now();
      // Upload to R2
      const url = await this.r2StorageService.uploadFile(
        key,
        file.buffer,
        file.mimetype,
      );
      const uploadDuration = Date.now() - uploadStartTime;

      const totalDuration = Date.now() - startTime;
      this.logger.log(
        `File upload successful - slug: ${slug}, fieldId: ${fieldId}, key: ${key}, url: ${url}, uploadDuration: ${uploadDuration}ms, totalDuration: ${totalDuration}ms`,
      );

      return {
        url,
        key,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      this.logger.error(
        `File upload failed - slug: ${slug}, fieldId: ${fieldId}, fileName: ${file.originalname}, error: ${error.message}, stack: ${error.stack}, duration: ${totalDuration}ms`,
      );
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  // Profile estimation calculation
  async calculateProfileEstimation(
    slug: string,
    answers: Record<string, unknown>,
  ) {
    const template = await this.findFormTemplateBySlug(slug);

    if (!template.profileEstimation) {
      throw new BadRequestException(
        'Profile estimation is not configured for this form',
      );
    }

    const profileEstimation = template.profileEstimation as any;

    if (!profileEstimation.enabled) {
      throw new BadRequestException(
        'Profile estimation is not enabled for this form',
      );
    }

    // First calculate rule-based result
    const ruleBasedResult = this.calculateRuleBasedResult(
      profileEstimation,
      answers,
      template.schema as any[],
    );

    // If AI is enabled, enhance with AI
    if (profileEstimation.aiConfig?.enabled) {
      try {
        const aiResult = await this.profileEstimationAI.enhanceWithAI({
          profileEstimation,
          answers,
          fields: template.schema as any[],
          ruleBasedResult,
        });

        // Merge AI result with rule-based result
        return {
          ...ruleBasedResult,
          aiEnhanced: true,
          aiResult,
        };
      } catch (error) {
        this.logger.warn(
          'AI enhancement failed, using rule-based result',
          error,
        );
        // Fallback to rule-based result
        return {
          ...ruleBasedResult,
          aiEnhanced: false,
          error: 'AI enhancement failed, using rule-based results',
        };
      }
    }

    return {
      ...ruleBasedResult,
      aiEnhanced: false,
    };
  }

  /**
   * Calculate rule-based profile estimation result
   * This delegates to frontend calculation logic via API call or shared library
   * For now, returns a basic structure - full implementation would share calculation logic
   */
  private calculateRuleBasedResult(
    profileEstimation: any,
    answers: Record<string, unknown>,
    fields: any[],
  ): any {
    // Basic rule-based calculation placeholder
    // In production, you'd want to share the calculation logic from frontend
    // or have a shared calculation service

    const resultType = profileEstimation.type;

    if (resultType === 'percentage') {
      // Would calculate percentage score here
      return {
        type: 'percentage',
        result: {
          score: 0,
          range: '',
          description: '',
        },
      };
    }

    if (resultType === 'category') {
      // Would match category here
      return {
        type: 'category',
        result: {
          category: null,
          confidence: 0,
        },
      };
    }

    if (resultType === 'multi_dimension') {
      return {
        type: 'multi_dimension',
        result: {
          scores: {},
        },
      };
    }

    if (resultType === 'recommendation') {
      return {
        type: 'recommendation',
        result: {
          recommendations: [],
        },
      };
    }

    return {
      type: resultType,
      result: {},
    };
  }
}
