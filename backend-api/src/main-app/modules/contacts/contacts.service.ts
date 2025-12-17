import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateContactSubmissionDto } from './dto/create-contact-submission.dto';
import { UpdateContactSubmissionDto } from './dto/update-contact-submission.dto';
import { CreateContactNoteDto } from './dto/create-contact-note.dto';
import { ContactFiltersDto } from './dto/contact-filters.dto';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateContactSubmissionDto, subAccountId: number) {
    return this.prisma.contactSubmission.create({
      data: {
        ...data,
        subAccountId,
        notes: [],
      },
      include: {
        assignedTo: true,
        subAccount: true,
      },
    });
  }

  findAll(subAccountId: number, filters?: ContactFiltersDto) {
    return this.prisma.contactSubmission.findMany({
      where: {
        subAccountId,
        status: filters?.status,
        priority: filters?.priority,
        assignedToId: filters?.assignedToId
          ? parseInt(filters.assignedToId)
          : undefined,
      },
      include: {
        assignedTo: true,
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  findOne(id: string, subAccountId: number) {
    return this.prisma.contactSubmission.findUnique({
      where: { id, subAccountId },
      include: {
        assignedTo: true,
        subAccount: true,
      },
    });
  }

  update(
    id: string,
    data: UpdateContactSubmissionDto,
    subAccountId: number,
  ) {
    // DTO fields now match Prisma schema exactly - no conversion needed
    return this.prisma.contactSubmission.update({
      where: { id, subAccountId },
      data,
      include: {
        assignedTo: true,
      },
    });
  }

  async addNote(
    contactId: string,
    noteData: CreateContactNoteDto,
    authorId: number,
    authorName: string,
  ) {
    const contact = await this.prisma.contactSubmission.findUnique({
      where: { id: contactId },
      select: { notes: true },
    });

    if (!contact) {
      throw new Error('Contact not found');
    }

    const currentNotes = (contact.notes as any[]) || [];
    const newNote = {
      content: noteData.content,
      createdAt: new Date().toISOString(),
      authorId,
      authorName,
    };

    const updatedNotes = [...currentNotes, newNote];

    return this.prisma.contactSubmission.update({
      where: { id: contactId },
      data: { notes: updatedNotes },
      include: {
        assignedTo: true,
      },
    });
  }

  async getStats(subAccountId: number) {
    const [total, newCount, inProgress, closed] = await Promise.all([
      this.prisma.contactSubmission.count({ where: { subAccountId } }),
      this.prisma.contactSubmission.count({
        where: { subAccountId, status: 'NEW' },
      }),
      this.prisma.contactSubmission.count({
        where: {
          subAccountId,
          status: { in: ['CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT'] },
        },
      }),
      this.prisma.contactSubmission.count({
        where: {
          subAccountId,
          status: { in: ['CLOSED_WON', 'CLOSED_LOST'] },
        },
      }),
    ]);

    return { total, newCount, inProgress, closed };
  }
}
