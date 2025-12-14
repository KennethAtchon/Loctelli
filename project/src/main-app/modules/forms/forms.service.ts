import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { R2StorageService } from '../../../shared/storage/r2-storage.service';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { UpdateFormTemplateDto } from './dto/update-form-template.dto';
import { CreateFormSubmissionDto } from './dto/create-form-submission.dto';
import { UpdateFormSubmissionDto } from './dto/update-form-submission.dto';

@Injectable()
export class FormsService {
  private readonly logger = new Logger(FormsService.name);

  constructor(
    private prisma: PrismaService,
    private r2StorageService: R2StorageService,
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
          schema: JSON.parse(JSON.stringify(data.schema)), // Convert FormFieldDto[] to JSON
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

  async findAllFormSubmissions(
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

  // Utility method for database wake-up
  async wakeUpDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'awake', timestamp: new Date() };
    } catch (error) {
      throw new BadRequestException('Failed to wake up database');
    }
  }

  // File upload for forms
  async uploadFormFile(
    slug: string,
    fieldId: string,
    file: Express.Multer.File,
  ) {
    if (!this.r2StorageService.isEnabled()) {
      throw new BadRequestException(
        'File upload is not available - R2 storage is disabled',
      );
    }

    // Verify form template exists
    const template = await this.findFormTemplateBySlug(slug);

    // Verify field exists and is a file/image field
    if (!template.schema || !Array.isArray(template.schema)) {
      throw new BadRequestException('Form template schema is invalid');
    }

    const schema = template.schema as any[];
    const field = schema.find((f: any) => f.id === fieldId);
    if (!field) {
      throw new BadRequestException(
        `Field '${fieldId}' not found in form template`,
      );
    }

    if (field.type !== 'file' && field.type !== 'image') {
      throw new BadRequestException(
        `Field '${fieldId}' is not a file upload field`,
      );
    }

    // Validate file type for image fields
    if (field.type === 'image' && !file.mimetype.startsWith('image/')) {
      throw new BadRequestException(
        'Only image files are allowed for this field',
      );
    }

    try {
      // Generate unique file key
      const timestamp = Date.now();
      const fileExtension = file.originalname.split('.').pop() || '';
      const key = `forms/${slug}/${fieldId}/${timestamp}.${fileExtension}`;

      // Upload to R2
      const url = await this.r2StorageService.uploadFile(
        key,
        file.buffer,
        file.mimetype,
      );

      return {
        url,
        key,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }
}
