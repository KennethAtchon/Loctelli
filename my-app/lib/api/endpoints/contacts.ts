import { ApiClient } from '../client';
import { 
  ContactSubmission, 
  CreateContactSubmissionDto, 
  UpdateContactSubmissionDto, 
  CreateContactNoteDto,
  ContactFiltersDto,
  ContactStats
} from '@/types';

export class ContactsApi extends ApiClient {
  async getContacts(filters?: ContactFiltersDto): Promise<ContactSubmission[]> {
    const queryParams = new URLSearchParams();
    if (filters?.status) {
      queryParams.append('status', filters.status);
    }
    if (filters?.priority) {
      queryParams.append('priority', filters.priority);
    }
    if (filters?.assignedToId) {
      queryParams.append('assignedToId', filters.assignedToId);
    }
    const queryString = queryParams.toString();
    return this.get<ContactSubmission[]>(`/contacts${queryString ? `?${queryString}` : ''}`);
  }

  async getContact(id: string): Promise<ContactSubmission> {
    return this.get<ContactSubmission>(`/contacts/${id}`);
  }

  async createContact(data: CreateContactSubmissionDto): Promise<ContactSubmission> {
    return this.post<ContactSubmission>('/contacts', data);
  }

  async updateContact(id: string, data: UpdateContactSubmissionDto): Promise<ContactSubmission> {
    return this.patch<ContactSubmission>(`/contacts/${id}`, data);
  }

  async addNote(contactId: string, data: CreateContactNoteDto): Promise<ContactSubmission> {
    return this.post<ContactSubmission>(`/contacts/${contactId}/notes`, data);
  }

  async getStats(): Promise<ContactStats> {
    return this.get<ContactStats>('/contacts/stats');
  }
}