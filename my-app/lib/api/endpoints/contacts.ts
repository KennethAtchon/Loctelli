import { ApiClient } from '../client';
import { 
  ContactSubmission, 
  CreateContactSubmissionDto, 
  UpdateContactSubmissionDto, 
  CreateContactNoteDto,
  ContactFiltersDto,
  ContactStats
} from '@/types';

export class ContactsApi {
  constructor(private client: ApiClient) {}
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
    return this.client.get<ContactSubmission[]>(`/contacts${queryString ? `?${queryString}` : ''}`);
  }

  async getContact(id: string): Promise<ContactSubmission> {
    return this.client.get<ContactSubmission>(`/contacts/${id}`);
  }

  async createContact(data: CreateContactSubmissionDto): Promise<ContactSubmission> {
    return this.client.post<ContactSubmission>('/contacts', data);
  }

  async updateContact(id: string, data: UpdateContactSubmissionDto): Promise<ContactSubmission> {
    return this.client.patch<ContactSubmission>(`/contacts/${id}`, data);
  }

  async addNote(contactId: string, data: CreateContactNoteDto): Promise<ContactSubmission> {
    return this.client.post<ContactSubmission>(`/contacts/${contactId}/notes`, data);
  }

  async getStats(): Promise<ContactStats> {
    return this.client.get<ContactStats>('/contacts/stats');
  }
}