import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactSubmissionDto } from './dto/create-contact-submission.dto';
import { UpdateContactSubmissionDto } from './dto/update-contact-submission.dto';
import { CreateContactNoteDto } from './dto/create-contact-note.dto';
import { ContactFiltersDto } from './dto/contact-filters.dto';
import { JwtAuthGuard } from '../../../shared/auth/auth.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { Public } from '../../../shared/decorators/public.decorator';
import { EmailService } from '../../../shared/email/email.service';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(
    private contactsService: ContactsService,
    private emailService: EmailService,
  ) {}

  @Post()
  @Public() // Allow public access for website form
  async create(@Body() createContactDto: CreateContactSubmissionDto) {
    // For public forms, use default subaccount or extract from domain
    // TODO: Implement proper subaccount detection for public forms
    const subAccountId = 1; // Default to first subaccount for now

    const contact = await this.contactsService.create(
      createContactDto,
      subAccountId,
    );

    // Send email notification
    try {
      await this.emailService.sendContactNotification(contact);
    } catch (error) {
      console.error('Failed to send email notification:', error);
      // Don't fail the contact creation if email fails
    }

    return contact;
  }

  @Get()
  async findAll(@CurrentUser() user: any, @Query() filters: ContactFiltersDto) {
    return this.contactsService.findAll(user.subAccountId, filters);
  }

  @Get('stats')
  async getStats(@CurrentUser() user: any) {
    return this.contactsService.getStats(user.subAccountId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.contactsService.findOne(id, user.subAccountId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateContactDto: UpdateContactSubmissionDto,
    @CurrentUser() user: any,
  ) {
    return this.contactsService.update(id, updateContactDto, user.subAccountId);
  }

  @Post(':id/notes')
  async addNote(
    @Param('id') contactId: string,
    @Body() createNoteDto: CreateContactNoteDto,
    @CurrentUser() user: any,
  ) {
    return this.contactsService.addNote(
      contactId,
      createNoteDto,
      user.id,
      user.name,
    );
  }
}
