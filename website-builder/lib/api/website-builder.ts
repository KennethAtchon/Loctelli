import { ApiClient } from './client';

export interface WebsiteFile {
  name: string;
  content: string;
  type: string;
  size?: number;
}

export interface Website {
  id: string;
  name: string;
  description?: string;
  type: string;
  files: WebsiteFile[];
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface AiEditRequest {
  websiteName: string;
  fileName: string;
  prompt: string;
  currentContent: string;
}

export interface AiEditResponse {
  success: boolean;
  modifiedContent: string;
  changes: {
    description: string;
    modifications: any;
  };
  error?: string;
}

export interface UploadResponse {
  success: boolean;
  website: Website;
  error?: string;
}

export interface ExportResponse {
  success: boolean;
  downloadUrl: string;
  error?: string;
}

export interface ChangeHistory {
  id: string;
  websiteId: string;
  fileName: string;
  description: string;
  prompt: string;
  modifications: any;
  status: 'applied' | 'reverted' | 'pending';
  createdAt: string;
}

export class WebsiteBuilderApi extends ApiClient {
  async uploadWebsite(files: File[], name: string, description?: string): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('name', name);
    if (description) {
      formData.append('description', description);
    }
    
    files.forEach((file) => {
      formData.append('files', file);
    });

    return this.post<UploadResponse>('/website-builder/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async getWebsite(name: string): Promise<Website> {
    return this.get<Website>(`/website-builder/websites/${name}`);
  }

  async aiEdit(request: AiEditRequest): Promise<AiEditResponse> {
    return this.post<AiEditResponse>('/website-builder/editor/modify', request);
  }

  async getChangeHistory(websiteName: string): Promise<ChangeHistory[]> {
    return this.get<ChangeHistory[]>(`/website-builder/editor/${websiteName}/history`);
  }

  async exportWebsite(websiteName: string): Promise<ExportResponse> {
    return this.get<ExportResponse>(`/website-builder/editor/${websiteName}/export`);
  }

  async saveChanges(websiteName: string, changes: any): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>(`/website-builder/editor/${websiteName}/save`, changes);
  }

  async revertChange(changeId: string): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>(`/website-builder/editor/revert/${changeId}`);
  }

  async applyChange(changeId: string): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>(`/website-builder/editor/apply/${changeId}`);
  }

  async listWebsites(): Promise<Website[]> {
    return this.get<Website[]>('/website-builder/websites');
  }

  async deleteWebsite(websiteName: string): Promise<{ success: boolean }> {
    return this.delete<{ success: boolean }>(`/website-builder/websites/${websiteName}`);
  }
} 