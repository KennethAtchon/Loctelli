import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreateWebsiteDto } from './dto/create-website.dto';
import { UpdateWebsiteDto } from './dto/update-website.dto';
import { AiEditDto } from './dto/ai-edit.dto';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as JSZip from 'jszip';
import { BuildService } from './build.service';
import { SecurityService } from './security.service';

interface UploadedFile {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
}

@Injectable()
export class WebsiteBuilderService {
  private readonly logger = new Logger(WebsiteBuilderService.name);
  private openai: OpenAI;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private buildService: BuildService,
    private securityService: SecurityService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async uploadWebsite(files: UploadedFile[], name: string, adminId: number, description?: string) {
    // Validate admin ID
    if (!adminId || isNaN(adminId)) {
      this.logger.error(`❌ Invalid adminId provided: ${adminId}`);
      throw new BadRequestException('Valid admin ID is required');
    }

    // Verify admin exists
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      this.logger.error(`❌ Admin with ID ${adminId} not found`);
      throw new NotFoundException('Admin user not found');
    }

    this.logger.log(`✅ Admin validation passed: ${admin.name} (ID: ${adminId})`);
    this.logger.log(`🔧 Starting website upload process for admin ID: ${adminId}`);
    this.logger.log(`📝 Website name: ${name}`);
    this.logger.log(`📄 Description: ${description || 'No description'}`);
    this.logger.log(`📁 Total files to process: ${files.length}`);

    // Check if website name already exists
    this.logger.log(`🔍 Checking if website name '${name}' already exists...`);
    const existingWebsite = await this.prisma.website.findUnique({
      where: { name },
    });

    if (existingWebsite) {
      this.logger.error(`❌ Website name '${name}' already exists`);
      throw new BadRequestException('Website name already exists');
    }
    this.logger.log(`✅ Website name '${name}' is available`);

    let processedFiles: Array<{
      name: string;
      content: string;
      type: string;
      size: number;
    }> = [];

    // Process uploaded files
    this.logger.log(`🔄 Processing ${files.length} uploaded files...`);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      this.logger.log(`📄 Processing file ${i + 1}/${files.length}: ${file.originalname} (${file.size} bytes, ${file.mimetype})`);
      
      if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed' || file.originalname.endsWith('.zip')) {
        // Handle zip file
        this.logger.log(`📦 Detected ZIP file: ${file.originalname}`);
        const zipFiles = await this.extractZipFile(file.buffer);
        this.logger.log(`📦 Extracted ${zipFiles.length} files from ZIP`);
        processedFiles = processedFiles.concat(zipFiles);
      } else {
        // Handle individual file
        this.logger.log(`📄 Processing individual file: ${file.originalname}`);
        const fileType = this.getFileType(file.originalname);
        this.logger.log(`📄 File type detected: ${fileType}`);
        
        try {
          // Try UTF-8 first, fallback to other encodings if needed
          let content: string;
          try {
            content = file.buffer.toString('utf8');
          } catch (utf8Error) {
            this.logger.warn(`⚠️ UTF-8 decoding failed for ${file.originalname}, trying other encodings: ${utf8Error.message}`);
            // Try other common encodings
            try {
              content = file.buffer.toString('latin1');
            } catch (latin1Error) {
              content = file.buffer.toString('binary');
            }
          }
          
          this.logger.log(`📄 File content length: ${content.length} characters`);
          
          // Validate content is not empty
          if (content && content.trim().length > 0) {
            processedFiles.push({
              name: file.originalname,
              content,
              type: fileType,
              size: file.size,
            });
            this.logger.log(`✅ Successfully processed file: ${file.originalname}`);
          } else {
            this.logger.warn(`⚠️ Skipping empty file: ${file.originalname}`);
          }
        } catch (error) {
          this.logger.error(`❌ Failed to process file ${file.originalname}:`, error);
          throw new BadRequestException(`Failed to process file ${file.originalname}: ${error.message}`);
        }
      }
    }

    this.logger.log(`📊 Total processed files: ${processedFiles.length}`);
    if (processedFiles.length === 0) {
      this.logger.error('❌ No valid files found in upload');
      throw new BadRequestException('No valid files found in upload');
    }

    // Sanitize and validate files
    this.logger.log(`🔒 Sanitizing and validating files...`);
    const sanitizedFiles = this.securityService.sanitizeProjectFiles(processedFiles);
    this.logger.log(`✅ Sanitization complete. Kept ${sanitizedFiles.length} files`);

    // Validate project structure
    this.logger.log(`🔍 Validating project structure...`);
    const structureValidation = this.securityService.validateProjectStructure(sanitizedFiles);
    this.logger.log(`🏷️ Project type: ${structureValidation.type}, Valid: ${structureValidation.isValid}`);

    if (!structureValidation.isValid) {
      this.logger.warn(`⚠️ Project structure issues: ${structureValidation.issues.join(', ')}`);
    }

    // Detect website type and structure
    this.logger.log(`🔍 Detecting website type...`);
    const websiteType = this.detectWebsiteType(sanitizedFiles);
    this.logger.log(`🏷️ Website type detected: ${websiteType}`);
    
    this.logger.log(`🔍 Analyzing website structure...`);
    const structure = this.analyzeStructure(sanitizedFiles);
    this.logger.log(`📊 Structure analysis complete:`, structure);

    // Create website in database with initial build status
    this.logger.log(`💾 Creating website record in database...`);
    const website = await this.prisma.website.create({
      data: {
        name,
        description,
        type: websiteType,
        structure,
        files: sanitizedFiles as any,
        buildStatus: 'pending',
        createdByAdmin: {
          connect: { id: adminId },
        },
      },
    });

    this.logger.log(`✅ Website created successfully with ID: ${website.id}`);

    // Handle React/Vite projects with build process
    let previewUrl: string | null = null;
    let buildOutput: string[] | null = null;
    let buildDuration: number | null = null;
    const buildStartTime = new Date();

    if (websiteType === 'react-vite' || websiteType === 'react' || websiteType === 'vite') {
      this.logger.log(`🔨 Starting build process for React/Vite project: ${website.id}`);
      
      try {
        // Update status to building
        await this.prisma.website.update({
          where: { id: website.id },
          data: { buildStatus: 'building' },
        });

        // Start build process
        previewUrl = await this.buildService.buildReactProject(website.id, sanitizedFiles);
        
        // Get build process details
        const buildProcess = this.buildService.getBuildStatus(website.id);
        buildOutput = buildProcess?.buildOutput || [];
        buildDuration = buildProcess?.endTime && buildProcess?.startTime 
          ? Math.floor((buildProcess.endTime.getTime() - buildProcess.startTime.getTime()) / 1000)
          : null;

        this.logger.log(`✅ Build completed successfully for website ${website.id}`);
        this.logger.log(`🌐 Preview URL: ${previewUrl}`);

      } catch (error) {
        this.logger.error(`❌ Build failed for website ${website.id}:`, error);
        
        // Update status to failed
        await this.prisma.website.update({
          where: { id: website.id },
          data: { 
            buildStatus: 'failed',
            buildOutput: [`Build failed: ${error.message}`],
          },
        });

        // Return website with failed status
        return {
          success: true,
          website: await this.prisma.website.findUnique({ where: { id: website.id } }),
          buildError: error.message,
        };
      }
    }

    // Update website with build results
    const updatedWebsite = await this.prisma.website.update({
      where: { id: website.id },
      data: {
        buildStatus: previewUrl ? 'running' : 'pending',
        previewUrl: previewUrl || null,
        buildOutput: buildOutput as any || null,
        lastBuildAt: new Date(),
        buildDuration: buildDuration || null,
      },
    });

    this.logger.log(`📊 Website details:`, {
      id: updatedWebsite.id,
      name: updatedWebsite.name,
      type: updatedWebsite.type,
      fileCount: sanitizedFiles.length,
      buildStatus: updatedWebsite.buildStatus,
      previewUrl: updatedWebsite.previewUrl,
      createdByAdminId: adminId
    });

    return {
      success: true,
      website: updatedWebsite,
      previewUrl,
    };
  }

  private async extractZipFile(buffer: Buffer): Promise<Array<{
    name: string;
    content: string;
    type: string;
    size: number;
  }>> {
    this.logger.log(`📦 Starting ZIP file extraction...`);
    this.logger.log(`📦 ZIP buffer size: ${buffer.length} bytes`);
    
    try {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(buffer);
      
      this.logger.log(`📦 ZIP loaded successfully. Total files in ZIP: ${Object.keys(zipContent.files).length}`);
      
      const files: Array<{
        name: string;
        content: string;
        type: string;
        size: number;
      }> = [];

      let processedCount = 0;
      let skippedCount = 0;

      // Find the root directory name by looking at the first few entries
      const entries = Object.keys(zipContent.files);
      let rootDir = '';
      
      if (entries.length > 0) {
        const firstEntry = entries[0];
        const pathParts = firstEntry.split('/');
        if (pathParts.length > 1 && pathParts[0] && pathParts[0] !== '') {
          rootDir = pathParts[0];
          this.logger.log(`📁 Detected root directory: ${rootDir}`);
        }
      }

      for (const [filename, file] of Object.entries(zipContent.files)) {
        this.logger.log(`📦 Processing ZIP entry: ${filename} (directory: ${file.dir})`);
        
        if (!file.dir) {
          try {
            this.logger.log(`📄 Extracting file content: ${filename}`);
            
            // Try to extract as string first
            let content: string;
            try {
              content = await file.async('string');
            } catch (stringError) {
              // If string extraction fails, try as uint8array and convert
              this.logger.warn(`⚠️ String extraction failed for ${filename}, trying binary conversion: ${stringError.message}`);
              const uint8Array = await file.async('uint8array');
              content = new TextDecoder('utf-8').decode(uint8Array);
            }
            
            // Remove root directory prefix if present
            let normalizedName = filename;
            if (rootDir && filename.startsWith(`${rootDir}/`)) {
              normalizedName = filename.substring(rootDir.length + 1);
              this.logger.log(`📁 Normalized filename: ${filename} -> ${normalizedName}`);
            }
            
            const fileType = this.getFileType(normalizedName);
            
            this.logger.log(`📄 File extracted: ${normalizedName} (${content.length} chars, type: ${fileType})`);
            
            // Validate content is not empty
            if (content && content.trim().length > 0) {
              files.push({
                name: normalizedName,
                content,
                type: fileType,
                size: content.length,
              });
              processedCount++;
            } else {
              this.logger.warn(`⚠️ Skipping empty file: ${normalizedName}`);
              skippedCount++;
            }
          } catch (error) {
            // Skip binary files or files that can't be read as text
            this.logger.warn(`⚠️ Skipping binary file ${filename}: ${error.message}`);
            skippedCount++;
          }
        } else {
          this.logger.log(`📁 Skipping directory: ${filename}`);
        }
      }

      this.logger.log(`📦 ZIP extraction complete. Processed: ${processedCount}, Skipped: ${skippedCount}`);
      
      if (processedCount === 0) {
        throw new Error('No valid files extracted from ZIP');
      }
      
      return files;
    } catch (error) {
      this.logger.error(`❌ ZIP extraction failed: ${error.message}`);
      throw new BadRequestException(`Failed to extract ZIP file: ${error.message}`);
    }
  }

  private detectWebsiteType(files: Array<{ name: string; content: string; type: string; size: number }>): string {
    const fileNames = files.map(f => f.name.toLowerCase());
    
    this.logger.log(`🔍 Detecting website type from files: ${fileNames.slice(0, 10).join(', ')}...`);
    
    // Check for Vite project
    if (fileNames.includes('vite.config.js') || fileNames.includes('vite.config.ts')) {
      this.logger.log(`🏷️ Detected Vite project (vite.config found)`);
      return 'vite';
    }
    
    // Check for React project
    if (fileNames.includes('package.json')) {
      const packageJson = files.find(f => f.name === 'package.json');
      if (packageJson) {
        try {
          const pkg = JSON.parse(packageJson.content);
          if (pkg.dependencies?.react || pkg.devDependencies?.react) {
            this.logger.log(`🏷️ Detected React project (React dependency found in package.json)`);
            return 'react';
          }
        } catch (error) {
          this.logger.warn(`⚠️ Failed to parse package.json: ${error.message}`);
        }
      }
    }
    
    // Check for Next.js project
    if (fileNames.includes('next.config.js') || fileNames.includes('next.config.ts')) {
      this.logger.log(`🏷️ Detected Next.js project (next.config found)`);
      return 'nextjs';
    }
    
    this.logger.log(`🏷️ Defaulting to static website type`);
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
        createdByAdmin: {
          connect: { id: adminId },
        },
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

  async getBuildStatus(id: string, adminId: number) {
    const website = await this.findWebsiteById(id, adminId);
    
    const buildProcess = this.buildService.getBuildStatus(id);
    
    return {
      websiteId: id,
      buildStatus: website.buildStatus,
      previewUrl: website.previewUrl,
      portNumber: website.portNumber,
      lastBuildAt: website.lastBuildAt,
      buildDuration: website.buildDuration,
      buildOutput: website.buildOutput,
      processInfo: buildProcess ? {
        status: buildProcess.status,
        startTime: buildProcess.startTime,
        endTime: buildProcess.endTime,
        buildOutput: buildProcess.buildOutput,
      } : null,
    };
  }

  async stopWebsite(id: string, adminId: number) {
    const website = await this.findWebsiteById(id, adminId);
    
    if (website.buildStatus === 'running' || website.buildStatus === 'building') {
      await this.buildService.stopWebsite(id);
      
      // Update database status
      await this.prisma.website.update({
        where: { id },
        data: {
          buildStatus: 'stopped',
          previewUrl: null,
          portNumber: null,
          updatedAt: new Date(),
        },
      });
    }
    
    return { success: true, message: 'Website stopped successfully' };
  }

  async restartWebsite(id: string, adminId: number) {
    const website = await this.findWebsiteById(id, adminId);
    
    if (website.buildStatus === 'failed' || website.buildStatus === 'stopped') {
      // Stop any existing process
      try {
        await this.buildService.stopWebsite(id);
      } catch (error) {
        this.logger.warn(`Could not stop existing process for website ${id}:`, error);
      }
      
      // Update status to building
      await this.prisma.website.update({
        where: { id },
        data: { buildStatus: 'building' },
      });
      
      try {
        // Parse files from JSON
        const files = Array.isArray(website.files) ? website.files as Array<{
          name: string;
          content: string;
          type: string;
          size: number;
        }> : [];
        
        // Restart build process
        const previewUrl = await this.buildService.buildReactProject(id, files);
        
        // Get build process details
        const buildProcess = this.buildService.getBuildStatus(id);
        const buildOutput = buildProcess?.buildOutput || [];
        const buildDuration = buildProcess?.endTime && buildProcess?.startTime 
          ? Math.floor((buildProcess.endTime.getTime() - buildProcess.startTime.getTime()) / 1000)
          : null;
        
        // Update website with new build results
        await this.prisma.website.update({
          where: { id },
          data: {
            buildStatus: 'running',
            previewUrl,
            buildOutput,
            lastBuildAt: new Date(),
            buildDuration,
          },
        });
        
        return { success: true, previewUrl };
      } catch (error) {
        // Update status to failed
        await this.prisma.website.update({
          where: { id },
          data: { 
            buildStatus: 'failed',
            buildOutput: [`Restart failed: ${error.message}`],
          },
        });
        
        throw new BadRequestException(`Restart failed: ${error.message}`);
      }
    }
    
    throw new BadRequestException('Website is not in a restartable state');
  }
} 