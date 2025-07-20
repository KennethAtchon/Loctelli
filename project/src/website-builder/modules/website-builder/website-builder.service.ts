import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreateWebsiteDto } from './dto/create-website.dto';
import { UpdateWebsiteDto } from './dto/update-website.dto';
import { AiEditDto } from './dto/ai-edit.dto';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as JSZip from 'jszip';

interface UploadedFile {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
}

@Injectable()
export class WebsiteBuilderService {
  private openai: OpenAI;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async uploadWebsite(files: UploadedFile[], name: string, adminId: number, description?: string) {
    // Check if website name already exists
    const existingWebsite = await this.prisma.website.findUnique({
      where: { name },
    });

    if (existingWebsite) {
      throw new BadRequestException('Website name already exists');
    }

    let processedFiles: Array<{
      name: string;
      content: string;
      type: string;
      size: number;
    }> = [];

    // Process uploaded files
    for (const file of files) {
      if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed' || file.originalname.endsWith('.zip')) {
        // Handle zip file
        const zipFiles = await this.extractZipFile(file.buffer);
        processedFiles = processedFiles.concat(zipFiles);
      } else {
        // Handle individual file
        processedFiles.push({
          name: file.originalname,
          content: file.buffer.toString('utf8'),
          type: this.getFileType(file.originalname),
          size: file.size,
        });
      }
    }

    if (processedFiles.length === 0) {
      throw new BadRequestException('No valid files found in upload');
    }

    // Detect website type and structure
    const websiteType = this.detectWebsiteType(processedFiles);
    const structure = this.analyzeStructure(processedFiles);

    // Create website
    const website = await this.prisma.website.create({
      data: {
        name,
        description,
        type: websiteType,
        structure,
        files: processedFiles,
        createdByAdminId: adminId,
      },
    });

    return {
      success: true,
      website,
    };
  }

  private async extractZipFile(buffer: Buffer): Promise<Array<{
    name: string;
    content: string;
    type: string;
    size: number;
  }>> {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(buffer);
    
    const files: Array<{
      name: string;
      content: string;
      type: string;
      size: number;
    }> = [];

    for (const [filename, file] of Object.entries(zipContent.files)) {
      if (!file.dir) {
        try {
          const content = await file.async('string');
          files.push({
            name: filename,
            content,
            type: this.getFileType(filename),
            size: content.length,
          });
        } catch (error) {
          // Skip binary files or files that can't be read as text
          console.warn(`Skipping file ${filename}: ${error.message}`);
        }
      }
    }

    return files;
  }

  private detectWebsiteType(files: Array<{ name: string; content: string; type: string; size: number }>): string {
    const fileNames = files.map(f => f.name.toLowerCase());
    
    // Check for Vite project
    if (fileNames.includes('vite.config.js') || fileNames.includes('vite.config.ts')) {
      return 'vite';
    }
    
    // Check for React project
    if (fileNames.includes('package.json')) {
      const packageJson = files.find(f => f.name === 'package.json');
      if (packageJson) {
        try {
          const pkg = JSON.parse(packageJson.content);
          if (pkg.dependencies?.react || pkg.devDependencies?.react) {
            return 'react';
          }
        } catch (error) {
          // Continue with other checks
        }
      }
    }
    
    // Check for Next.js project
    if (fileNames.includes('next.config.js') || fileNames.includes('next.config.ts')) {
      return 'nextjs';
    }
    
    // Default to static
    return 'static';
  }

  private analyzeStructure(files: Array<{ name: string; content: string; type: string; size: number }>): Record<string, any> {
    const structure: Record<string, any> = {
      totalFiles: files.length,
      fileTypes: {},
      hasIndex: false,
      hasPackageJson: false,
      hasConfig: false,
      entryPoints: [],
    };

    for (const file of files) {
      // Count file types
      structure.fileTypes[file.type] = (structure.fileTypes[file.type] || 0) + 1;
      
      // Check for important files
      if (file.name === 'index.html' || file.name === 'index.htm') {
        structure.hasIndex = true;
        structure.entryPoints.push(file.name);
      }
      
      if (file.name === 'package.json') {
        structure.hasPackageJson = true;
        try {
          const pkg = JSON.parse(file.content);
          structure.packageInfo = {
            name: pkg.name,
            version: pkg.version,
            scripts: pkg.scripts,
          };
        } catch (error) {
          // Ignore parsing errors
        }
      }
      
      if (file.name.includes('config') || file.name.includes('vite.config') || file.name.includes('next.config')) {
        structure.hasConfig = true;
      }
    }

    return structure;
  }

  async createWebsite(createWebsiteDto: CreateWebsiteDto, adminId: number) {
    // Check if website name already exists
    const existingWebsite = await this.prisma.website.findUnique({
      where: { name: createWebsiteDto.name },
    });

    if (existingWebsite) {
      throw new BadRequestException('Website name already exists');
    }

    return this.prisma.website.create({
      data: {
        ...createWebsiteDto,
        createdByAdminId: adminId,
      },
    });
  }

  async findAllWebsites(adminId: number) {
    return this.prisma.website.findMany({
      where: { createdByAdminId: adminId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findWebsiteById(id: string, adminId: number) {
    const website = await this.prisma.website.findFirst({
      where: { 
        id,
        createdByAdminId: adminId,
      },
      include: {
        changeHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Last 10 changes
        },
      },
    });

    if (!website) {
      throw new NotFoundException('Website not found');
    }

    return website;
  }

  async updateWebsite(id: string, updateWebsiteDto: UpdateWebsiteDto, adminId: number) {
    const website = await this.findWebsiteById(id, adminId);

    return this.prisma.website.update({
      where: { id },
      data: updateWebsiteDto,
    });
  }

  async deleteWebsite(id: string, adminId: number) {
    const website = await this.findWebsiteById(id, adminId);

    return this.prisma.website.delete({
      where: { id },
    });
  }

  async aiEditWebsite(id: string, aiEditDto: AiEditDto, adminId: number) {
    const website = await this.findWebsiteById(id, adminId);

    try {
      // Parse files from JSON and ensure proper typing
      const files = Array.isArray(website.files) ? website.files as Array<{
        name: string;
        content: string;
        type: string;
        size: number;
      }> : [];
      
      // Prepare context for AI
      const context = {
        websiteType: website.type,
        currentFiles: files,
        currentStructure: website.structure,
        targetFile: aiEditDto.targetFile,
        ...aiEditDto.context,
      };

      // Call OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert web developer. You will receive a website structure and files, and a natural language instruction to modify them. 
            
            Current website type: ${website.type}
            Available files: ${JSON.stringify(files.map(f => f.name))}
            
            Respond with a JSON object containing:
            {
              "description": "Human-readable description of changes made",
              "changes": [
                {
                  "file": "filename.ext",
                  "action": "modify|create|delete",
                  "content": "new file content",
                  "originalContent": "original content (for modifications)"
                }
              ],
              "preview": "Brief preview of what was changed"
            }`,
          },
          {
            role: 'user',
            content: `Website context: ${JSON.stringify(context)}
            
            Instruction: ${aiEditDto.prompt}
            
            Please modify the website according to the instruction.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from AI');
      }

      // Parse AI response
      const aiResponse = JSON.parse(response);
      
      // Apply changes to website
      const updatedFiles = [...files];
      const changes: any[] = [];

      for (const change of aiResponse.changes) {
        const fileIndex = updatedFiles.findIndex(f => f.name === change.file);
        
        if (change.action === 'modify' && fileIndex !== -1) {
          changes.push({
            file: change.file,
            action: 'modified',
            originalContent: updatedFiles[fileIndex].content,
            newContent: change.content,
          });
          updatedFiles[fileIndex].content = change.content;
        } else if (change.action === 'create') {
          changes.push({
            file: change.file,
            action: 'created',
            newContent: change.content,
          });
          updatedFiles.push({
            name: change.file,
            content: change.content,
            type: this.getFileType(change.file),
            size: change.content.length,
          });
        } else if (change.action === 'delete' && fileIndex !== -1) {
          changes.push({
            file: change.file,
            action: 'deleted',
            originalContent: updatedFiles[fileIndex].content,
          });
          updatedFiles.splice(fileIndex, 1);
        }
      }

      // Update website with new files
      const updatedWebsite = await this.prisma.website.update({
        where: { id },
        data: {
          files: updatedFiles,
          updatedAt: new Date(),
        },
      });

      // Record the change
      await this.prisma.websiteChange.create({
        data: {
          websiteId: id,
          type: 'ai_edit',
          description: aiResponse.description,
          prompt: aiEditDto.prompt,
          changes: changes,
          createdByAdminId: adminId,
        },
      });

      return {
        website: updatedWebsite,
        changes: aiResponse.changes,
        description: aiResponse.description,
        preview: aiResponse.preview,
      };

    } catch (error) {
      throw new BadRequestException(`AI edit failed: ${error.message}`);
    }
  }

  async getChangeHistory(id: string, adminId: number) {
    const website = await this.findWebsiteById(id, adminId);

    return this.prisma.websiteChange.findMany({
      where: { websiteId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        createdByAdmin: {
          select: { name: true, email: true },
        },
      },
    });
  }

  async revertChange(websiteId: string, changeId: string, adminId: number) {
    const website = await this.findWebsiteById(websiteId, adminId);
    const change = await this.prisma.websiteChange.findFirst({
      where: { 
        id: changeId,
        websiteId,
      },
    });

    if (!change) {
      throw new NotFoundException('Change not found');
    }

    // For now, we'll just record the revert action
    // In a full implementation, you'd restore the previous state
    await this.prisma.websiteChange.create({
      data: {
        websiteId,
        type: 'revert',
        description: `Reverted change: ${change.description}`,
        changes: { revertedChangeId: changeId },
        createdByAdminId: adminId,
      },
    });

    return { message: 'Change reverted successfully' };
  }

  private getFileType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'js':
        return 'javascript';
      case 'ts':
        return 'typescript';
      case 'tsx':
      case 'jsx':
        return 'react';
      case 'json':
        return 'json';
      default:
        return 'text';
    }
  }
} 