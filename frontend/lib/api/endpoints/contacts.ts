import { ApiClient } from "../client";
import {
  ContactSubmission,
  CreateContactSubmissionDto,
  UpdateContactSubmissionDto,
  CreateContactNoteDto,
  ContactFiltersDto,
  ContactStats,
} from "@/types";
import { EndpointApiBuilder, EndpointApi } from "../config/endpoint-builder";
import { contactsConfig } from "../config/contacts.config";

export class ContactsApi {
  private api: EndpointApi<typeof contactsConfig>;

  constructor(private client: ApiClient) {
    const builder = new EndpointApiBuilder(client);
    this.api = builder.buildApi(contactsConfig);
  }

  async getContacts(filters?: ContactFiltersDto): Promise<ContactSubmission[]> {
    return this.api.getContacts(filters) as Promise<ContactSubmission[]>;
  }

  async getContact(id: string): Promise<ContactSubmission> {
    return this.api.getContact({ id }) as Promise<ContactSubmission>;
  }

  async createContact(
    data: CreateContactSubmissionDto
  ): Promise<ContactSubmission> {
    return this.api.createContact(
      undefined,
      data
    ) as Promise<ContactSubmission>;
  }

  async updateContact(
    id: string,
    data: UpdateContactSubmissionDto
  ): Promise<ContactSubmission> {
    return this.api.updateContact({ id }, data) as Promise<ContactSubmission>;
  }

  async addNote(
    contactId: string,
    data: CreateContactNoteDto
  ): Promise<ContactSubmission> {
    return this.api.addNote({ contactId }, data) as Promise<ContactSubmission>;
  }

  async getStats(): Promise<ContactStats> {
    return this.api.getStats() as Promise<ContactStats>;
  }
}
