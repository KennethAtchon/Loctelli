import { Injectable, Logger } from '@nestjs/common';
import { R2StorageService } from './r2-storage.service';
import * as JSZip from 'jszip';
import * as crypto from 'crypto';
import * as path from 'path';

export interface GenericFile {
  name: string;
  path: string;
  size: number;
  type: string;
  hash: string | null;
  content?: Buffer;
}

@Injectable()
export class FileProcessingService {
  private readonly logger = new Logger(FileProcessingService.name);

  constructor(private r2Storage: R2StorageService) {}

  /**
   * Upload a file to R2
   */
  async uploadFile(
    filePath: string,
    content: Buffer,
    mimeType: string,
  ): Promise<string> {
    await this.r2Storage.uploadToFolder('', filePath, content, mimeType);
    return this.r2Storage.getPublicUrl(filePath);
  }

  /**
   * Download a file from R2
   */
  async getFileContent(filePath: string): Promise<Buffer> {
    return this.r2Storage.getFileContent(filePath);
  }

  /**
   * Update a file in R2
   */
  async updateFileContent(
    filePath: string,
    content: Buffer,
    mimeType: string,
  ): Promise<void> {
    await this.r2Storage.uploadToFolder('', filePath, content, mimeType);
  }

  /**
   * Delete a file from R2
   */
  async deleteFile(filePath: string): Promise<void> {
    await this.r2Storage.deleteFile(filePath);
  }

  /**
   * Extract ZIP and upload individual files to R2
   */
  async extractAndUploadFiles(zipBuffer: Buffer): Promise<GenericFile[]> {
    const extractedFiles: GenericFile[] = [];
    try {
      const zip = new JSZip();
      await zip.loadAsync(zipBuffer);
      for (const [filePath, zipEntry] of Object.entries(zip.files)) {
        if (!zipEntry.dir) {
          const content = await zipEntry.async('nodebuffer');
          const mimeType = this.getMimeType(filePath);
          await this.r2Storage.uploadToFolder('', filePath, content, mimeType);
          extractedFiles.push({
            name: path.basename(filePath),
            path: filePath,
            size: content.length,
            type: mimeType,
            hash: this.calculateHash(content),
            content,
          });
        }
      }
      return extractedFiles;
    } catch (error) {
      this.logger.error(`Error extracting ZIP file: ${error.message}`);
      throw new Error(`Failed to extract ZIP file: ${error.message}`);
    }
  }

  /**
   * Calculate file hash for caching and integrity
   */
  private calculateHash(content: Buffer): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get MIME type based on file extension
   */
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase().substring(1);
    const mimeTypes: Record<string, string> = {
      html: 'text/html',
      htm: 'text/html',
      css: 'text/css',
      js: 'application/javascript',
      json: 'application/json',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      txt: 'text/plain',
      md: 'text/markdown',
      xml: 'application/xml',
      pdf: 'application/pdf',
      zip: 'application/zip',
      ts: 'application/typescript',
      tsx: 'application/typescript',
      jsx: 'application/javascript',
      scss: 'text/x-scss',
      sass: 'text/x-sass',
      less: 'text/x-less',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}
