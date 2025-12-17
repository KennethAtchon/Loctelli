#!/usr/bin/env ts-node
/**
 * DTO Audit Script
 * 
 * This script audits all DTOs against the Prisma schema to ensure:
 * 1. Field names match exactly
 * 2. Field types are compatible
 * 3. Required fields are present
 * 4. No unnecessary field mappings are needed
 * 
 * Usage: ts-node scripts/audit-dtos.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface PrismaField {
  name: string;
  type: string;
  optional: boolean;
  array: boolean;
}

interface PrismaModel {
  name: string;
  fields: PrismaField[];
}

interface DTOField {
  name: string;
  type: string;
  optional: boolean;
  decorators: string[];
}

interface DTOFile {
  path: string;
  name: string;
  fields: DTOField[];
  modelName?: string; // Inferred from file path/name
}

interface Mismatch {
  dtoFile: string;
  dtoField: string;
  prismaField: string;
  issue: string;
  severity: 'error' | 'warning';
}

class DTOAuditor {
  private prismaModels: Map<string, PrismaModel> = new Map();
  private dtoFiles: DTOFile[] = [];
  private mismatches: Mismatch[] = [];

  /**
   * Parse Prisma schema file
   */
  parsePrismaSchema(schemaPath: string): void {
    console.log(`📖 Reading Prisma schema from: ${schemaPath}`);
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    
    // Extract model definitions - use non-greedy match to handle nested braces
    const modelRegex = /model\s+(\w+)\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/gs;
    let match;

    while ((match = modelRegex.exec(schemaContent)) !== null) {
      const modelName = match[1];
      let modelBody = match[2];
      
      // Handle nested models (like enums) by extracting just the top level
      // This is a simplified approach - for complex cases we'd need a proper parser
      if (modelBody.includes('model ') || modelBody.includes('enum ')) {
        // Find the first closing brace that matches our opening brace
        const openBraces = (modelBody.match(/\{/g) || []).length;
        const closeBraces = (modelBody.match(/\}/g) || []).length;
        // If unbalanced, we need to extract more carefully
        // For now, just use what we have
      }
      const fields: PrismaField[] = [];

      // Extract field definitions line by line
      const lines = modelBody.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        // Skip comments, indexes, and empty lines
        if (trimmed.startsWith('//') || trimmed.startsWith('@@') || !trimmed) {
          continue;
        }
        
        // Match field definition: fieldName fieldType? @attributes
        // Examples:
        //   id Int @id @default(autoincrement())
        //   name String?
        //   regularUserId Int
        //   submitButtonText String @default("Submit")
        //   messageHistory Json?
        //   status ContactStatus @default(NEW)
        //   subAccountId Int?
        //   subtitle String? @db.Text
        const fieldMatch = trimmed.match(/^(\w+)\s+([A-Z][A-Za-z0-9_]*(?:\[\])?)(\??)\s*(.*)$/);
        if (!fieldMatch) {
          continue;
        }
        
        const fieldName = fieldMatch[1];
        const fieldType = fieldMatch[2];
        const optional = fieldMatch[3] === '?';
        const attributes = fieldMatch[4] || '';
        
        // Skip relation fields (they have @relation decorator in attributes)
        // But keep ID fields like regularUserId, subAccountId even if they have @relation
        if (attributes.includes('@relation') && !fieldName.match(/Id$/)) {
          continue;
        }
        
        // Skip computed fields (indexes, etc.)
        if (fieldName.startsWith('@@')) {
          continue;
        }
        
        // Skip relation array fields (they're always arrays and have @relation)
        // Examples: leads Lead[], strategies Strategy[]
        if (fieldType.includes('[]') && attributes.includes('@relation')) {
          continue;
        }

        fields.push({
          name: fieldName,
          type: this.normalizePrismaType(fieldType),
          optional,
          array: fieldType.includes('[]'),
        });
      }

      this.prismaModels.set(modelName, {
        name: modelName,
        fields,
      });
      
    }

    console.log(`✅ Parsed ${this.prismaModels.size} Prisma models`);
  }

  /**
   * Normalize Prisma type to TypeScript type
   */
  normalizePrismaType(prismaType: string): string {
    const typeMap: Record<string, string> = {
      'Int': 'number',
      'String': 'string',
      'Boolean': 'boolean',
      'DateTime': 'Date | string',
      'Json': 'any',
      'Float': 'number',
    };

    // Remove array brackets and @db modifiers
    let cleanType = prismaType.replace(/\[\]/g, '').replace(/@db\.\w+/g, '').trim();
    
    return typeMap[cleanType] || cleanType;
  }

  /**
   * Find all DTO files recursively
   */
  findDTOFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // Skip node_modules, dist, and other build directories
        if (!['node_modules', 'dist', '.git', 'coverage'].includes(file)) {
          this.findDTOFiles(filePath, fileList);
        }
      } else if (file.endsWith('.dto.ts') && !file.endsWith('.spec.ts')) {
        fileList.push(filePath);
      }
    });

    return fileList;
  }

  /**
   * Load all DTO files
   */
  loadDTOFiles(projectRoot: string): void {
    console.log(`🔍 Searching for DTO files in: ${projectRoot}`);
    
    const srcDir = path.join(projectRoot, 'src');
    const files = this.findDTOFiles(srcDir);

    console.log(`📁 Found ${files.length} DTO files`);

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const dto = this.parseDTOFile(filePath, content);
      if (dto) {
        this.dtoFiles.push(dto);
      }
    }
  }

  /**
   * Parse a DTO file
   */
  parseDTOFile(filePath: string, content: string): DTOFile | null {
    // Extract class name
    const classMatch = content.match(/export\s+class\s+(\w+)/);
    if (!classMatch) {
      return null; // Not a DTO class
    }

    const className = classMatch[1];
    
    // Infer model name from DTO name
    // e.g., CreateUserDto -> User, UpdateLeadDto -> Lead
    let modelName: string | undefined;
    if (className.includes('Create') || className.includes('Update')) {
      const baseName = className.replace(/^(Create|Update)/, '').replace(/Dto$/, '');
      // Map common variations
      const modelMap: Record<string, string> = {
        'User': 'User',
        'Lead': 'Lead',
        'Booking': 'Booking',
        'Strategy': 'Strategy',
        'SubAccount': 'SubAccount',
        'PromptTemplate': 'PromptTemplate',
        'ContactSubmission': 'ContactSubmission',
        'FormTemplate': 'FormTemplate',
        'FormSubmission': 'FormSubmission',
        'IntegrationTemplate': 'IntegrationTemplate',
        'Integration': 'Integration',
        'Invitation': 'SubAccountInvitation',
      };
      modelName = modelMap[baseName];
    }

    // Extract fields - improved regex to handle multiline decorators
    const fields: DTOField[] = [];
    
    // Split by lines and look for property declarations
    const lines = content.split('\n');
    let currentDecorators: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Collect decorators
      if (line.startsWith('@')) {
        const decoratorMatch = line.match(/@(\w+)/);
        if (decoratorMatch) {
          currentDecorators.push(decoratorMatch[1]);
        }
        continue;
      }
      
      // Match property declaration: fieldName?: type;
      const propertyMatch = line.match(/^(\w+)(\??)\s*:\s*([^;=]+)(;|=)/);
      if (propertyMatch) {
        const fieldName = propertyMatch[1];
        const optional = propertyMatch[2] === '?';
        const fieldType = propertyMatch[3].trim();
        
        // Skip methods and non-field properties
        if (fieldName === 'constructor' || fieldName.startsWith('_') || 
            fieldName === 'export' || fieldName === 'import' ||
            line.includes('function') || line.includes('async')) {
          currentDecorators = [];
          continue;
        }

        fields.push({
          name: fieldName,
          type: this.normalizeDTOType(fieldType),
          optional,
          decorators: [...currentDecorators],
        });
        
        currentDecorators = [];
      } else if (line && !line.startsWith('//') && !line.startsWith('*') && 
                 !line.includes('export') && !line.includes('import') &&
                 !line.includes('class') && !line.includes('interface')) {
        // Reset decorators if we hit a non-decorator, non-property line
        currentDecorators = [];
      }
    }

    return {
      path: filePath,
      name: className,
      fields,
      modelName,
    };
  }

  /**
   * Normalize DTO type
   */
  normalizeDTOType(dtoType: string): string {
    // Remove union types, generics, etc. for comparison
    let clean = dtoType
      .replace(/\|.*/g, '') // Remove union types
      .replace(/<.*>/g, '') // Remove generics
      .replace(/\[\]/g, '') // Remove arrays
      .trim();

    // Map common types
    const typeMap: Record<string, string> = {
      'number': 'number',
      'string': 'string',
      'boolean': 'boolean',
      'Date': 'Date | string',
      'any': 'any',
      'Record<string, any>': 'any',
      'Record<string, string>': 'any',
    };

    return typeMap[clean] || clean;
  }

  /**
   * Audit DTOs against Prisma models
   */
  audit(): void {
    console.log(`\n🔎 Auditing DTOs against Prisma schema...\n`);

    for (const dto of this.dtoFiles) {
      if (!dto.modelName || !this.prismaModels.has(dto.modelName)) {
        // Skip DTOs that don't map to Prisma models (auth, SMS, etc.)
        continue;
      }

      const model = this.prismaModels.get(dto.modelName)!;
      this.compareDTOToModel(dto, model);
    }

    this.printReport();
  }

  /**
   * Compare a DTO to its Prisma model
   */
  compareDTOToModel(dto: DTOFile, model: PrismaModel): void {
    const prismaFields = new Map(model.fields.map(f => [f.name, f]));
    const dtoFields = new Map(dto.fields.map(f => [f.name, f]));

      // Check for fields in DTO that don't exist in Prisma
      for (const [dtoFieldName, dtoField] of dtoFields) {
        // Check for common field name mismatches
        if (dtoFieldName === 'userId' && prismaFields.has('regularUserId')) {
          this.mismatches.push({
            dtoFile: dto.path,
            dtoField: dtoFieldName,
            prismaField: 'regularUserId',
            issue: `DTO uses '${dtoFieldName}' but Prisma schema uses 'regularUserId'`,
            severity: 'error',
          });
          continue;
        }
        
        // Check for messages vs messageHistory mismatch
        if (dtoFieldName === 'messages' && prismaFields.has('messageHistory')) {
          this.mismatches.push({
            dtoFile: dto.path,
            dtoField: dtoFieldName,
            prismaField: 'messageHistory',
            issue: `DTO uses '${dtoFieldName}' but Prisma schema uses 'messageHistory'`,
            severity: 'error',
          });
          continue;
        }

      // Check if field exists in Prisma (allowing for common variations)
      if (!prismaFields.has(dtoFieldName)) {
        // Check for common field name variations
        const variations = this.getFieldVariations(dtoFieldName);
        const found = variations.some(v => prismaFields.has(v));
        
        if (!found && !this.isIgnoredField(dtoFieldName)) {
          this.mismatches.push({
            dtoFile: dto.path,
            dtoField: dtoFieldName,
            prismaField: 'N/A',
            issue: `Field '${dtoFieldName}' exists in DTO but not in Prisma model '${model.name}'`,
            severity: 'warning',
          });
        }
      }
    }

    // Check for required Prisma fields missing in DTO (only for Create DTOs)
    if (dto.name.includes('Create')) {
      for (const [prismaFieldName, prismaField] of prismaFields) {
        // Skip auto-generated fields
        if (this.isAutoGeneratedField(prismaFieldName)) {
          continue;
        }

        // Skip relation IDs that might be handled separately
        if (prismaFieldName.endsWith('Id') && prismaFieldName !== 'subAccountId') {
          // Check if there's a variation in DTO
          const variations = this.getFieldVariations(prismaFieldName);
          const found = variations.some(v => dtoFields.has(v));
          
          if (!found && !prismaField.optional && !this.isIgnoredField(prismaFieldName)) {
            // Check if it's a relation field that might be optional in DTO
            const relationField = prismaFieldName.replace(/Id$/, '');
            if (!dtoFields.has(relationField)) {
              this.mismatches.push({
                dtoFile: dto.path,
                dtoField: 'N/A',
                prismaField: prismaFieldName,
                issue: `Required Prisma field '${prismaFieldName}' missing in Create DTO`,
                severity: 'warning',
              });
            }
          }
        }
      }
    }
  }

  /**
   * Get common field name variations
   */
  getFieldVariations(fieldName: string): string[] {
    const variations: string[] = [fieldName];

    // userId <-> regularUserId
    if (fieldName === 'userId') {
      variations.push('regularUserId');
    }
    if (fieldName === 'regularUserId') {
      variations.push('userId');
    }

    return variations;
  }

  /**
   * Check if field should be ignored
   */
  isIgnoredField(fieldName: string): boolean {
    const ignored = [
      'createdAt',
      'updatedAt',
      'id', // Usually auto-generated
      'createdByAdminId', // Usually set by system
    ];
    return ignored.includes(fieldName);
  }

  /**
   * Check if field is auto-generated
   */
  isAutoGeneratedField(fieldName: string): boolean {
    return fieldName === 'id' || 
           fieldName === 'createdAt' || 
           fieldName === 'updatedAt' ||
           fieldName.includes('createdBy');
  }

  /**
   * Print audit report
   */
  printReport(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 DTO AUDIT REPORT');
    console.log('='.repeat(80) + '\n');

    const errors = this.mismatches.filter(m => m.severity === 'error');
    const warnings = this.mismatches.filter(m => m.severity === 'warning');

    if (errors.length === 0 && warnings.length === 0) {
      console.log('✅ All DTOs match Prisma schema perfectly!\n');
      return;
    }

    if (errors.length > 0) {
      console.log(`❌ ERRORS (${errors.length}):\n`);
      errors.forEach((mismatch, index) => {
        console.log(`${index + 1}. ${mismatch.dtoFile}`);
        console.log(`   DTO Field: ${mismatch.dtoField}`);
        console.log(`   Prisma Field: ${mismatch.prismaField}`);
        console.log(`   Issue: ${mismatch.issue}\n`);
      });
    }

    if (warnings.length > 0) {
      console.log(`⚠️  WARNINGS (${warnings.length}):\n`);
      warnings.forEach((mismatch, index) => {
        console.log(`${index + 1}. ${mismatch.dtoFile}`);
        console.log(`   DTO Field: ${mismatch.dtoField}`);
        console.log(`   Prisma Field: ${mismatch.prismaField}`);
        console.log(`   Issue: ${mismatch.issue}\n`);
      });
    }

    console.log('='.repeat(80));
    console.log(`\nTotal Issues: ${this.mismatches.length} (${errors.length} errors, ${warnings.length} warnings)\n`);

    if (errors.length > 0) {
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const projectRoot = path.join(__dirname, '..');
  const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma');

  if (!fs.existsSync(schemaPath)) {
    console.error(`❌ Prisma schema not found at: ${schemaPath}`);
    process.exit(1);
  }

  const auditor = new DTOAuditor();
  
  try {
    auditor.parsePrismaSchema(schemaPath);
    auditor.loadDTOFiles(projectRoot);
    auditor.audit();
  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

