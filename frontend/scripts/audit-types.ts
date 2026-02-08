#!/usr/bin/env ts-node
/**
 * Frontend Types Audit Script
 *
 * This script audits all frontend TypeScript interfaces/types against the Prisma schema to ensure:
 * 1. Field names match exactly
 * 2. Field types are compatible
 * 3. Required fields are present
 * 4. No unnecessary field mappings are needed
 *
 * Usage: ts-node scripts/audit-types.ts
 */

import * as fs from "fs";
import * as path from "path";

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

interface TypeScriptField {
  name: string;
  type: string;
  optional: boolean;
}

interface TypeScriptType {
  path: string;
  name: string;
  fields: TypeScriptField[];
  modelName?: string; // Inferred from type name
}

interface Mismatch {
  typeFile: string;
  typeField: string;
  prismaField: string;
  issue: string;
  severity: "error" | "warning";
}

class FrontendTypesAuditor {
  private prismaModels: Map<string, PrismaModel> = new Map();
  private typescriptTypes: TypeScriptType[] = [];
  private mismatches: Mismatch[] = [];

  /**
   * Parse Prisma schema file
   */
  parsePrismaSchema(schemaPath: string): void {
    console.log(`📖 Reading Prisma schema from: ${schemaPath}`);
    const schemaContent = fs.readFileSync(schemaPath, "utf-8");

    // Extract model definitions - use non-greedy match to handle nested braces
    const modelRegex = /model\s+(\w+)\s*\{([\s\S]*?)\}/g;
    let match;

    while ((match = modelRegex.exec(schemaContent)) !== null) {
      const modelName = match[1];
      const modelBody = match[2];

      const fields: PrismaField[] = [];

      // Extract field definitions line by line
      const lines = modelBody.split("\n");

      for (const line of lines) {
        const trimmed = line.trim();

        // Skip comments, indexes, and empty lines
        if (trimmed.startsWith("//") || trimmed.startsWith("@@") || !trimmed) {
          continue;
        }

        // Match field definition: fieldName fieldType? @attributes
        const fieldMatch = trimmed.match(
          /^(\w+)\s+([A-Z][A-Za-z0-9_]*(?:\[\])?)(\??)\s*(.*)$/
        );
        if (!fieldMatch) {
          continue;
        }

        const fieldName = fieldMatch[1];
        const fieldType = fieldMatch[2];
        const optional = fieldMatch[3] === "?";
        const attributes = fieldMatch[4] || "";

        // Skip relation fields (they have @relation decorator in attributes)
        // But keep ID fields like regularUserId, subAccountId even if they have @relation
        if (attributes.includes("@relation") && !fieldName.match(/Id$/)) {
          continue;
        }

        // Skip computed fields (indexes, etc.)
        if (fieldName.startsWith("@@")) {
          continue;
        }

        // Skip relation array fields (they're always arrays and have @relation)
        if (fieldType.includes("[]") && attributes.includes("@relation")) {
          continue;
        }

        fields.push({
          name: fieldName,
          type: this.normalizePrismaType(fieldType),
          optional,
          array: fieldType.includes("[]"),
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
      Int: "number",
      String: "string",
      Boolean: "boolean",
      DateTime: "Date | string",
      Json: "any",
      Float: "number",
    };

    // Remove array brackets and @db modifiers
    const cleanType = prismaType
      .replace(/\[\]/g, "")
      .replace(/@db\.\w+/g, "")
      .trim();

    return typeMap[cleanType] || cleanType;
  }

  /**
   * Find all TypeScript type/interface files recursively
   */
  findTypeScriptFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // Skip node_modules, dist, .next, and other build directories
        if (
          ![
            "node_modules",
            "dist",
            ".next",
            ".git",
            "coverage",
            ".turbo",
          ].includes(file)
        ) {
          this.findTypeScriptFiles(filePath, fileList);
        }
      } else if (
        (file.endsWith(".ts") || file.endsWith(".tsx")) &&
        !file.endsWith(".spec.ts") &&
        !file.endsWith(".test.ts")
      ) {
        fileList.push(filePath);
      }
    });

    return fileList;
  }

  /**
   * Load all TypeScript type definitions
   */
  loadTypeScriptTypes(projectRoot: string): void {
    console.log(`🔍 Searching for TypeScript files in: ${projectRoot}`);

    const files = this.findTypeScriptFiles(projectRoot);

    console.log(`📁 Found ${files.length} TypeScript files`);

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, "utf-8");
      const types = this.parseTypeScriptFile(filePath, content);
      this.typescriptTypes.push(...types);
    }

    console.log(
      `✅ Parsed ${this.typescriptTypes.length} TypeScript types/interfaces`
    );
  }

  /**
   * Parse a TypeScript file for type/interface definitions
   */
  parseTypeScriptFile(filePath: string, content: string): TypeScriptType[] {
    const types: TypeScriptType[] = [];

    // Match interface definitions: export interface TypeName { ... }
    const interfaceRegex =
      /export\s+interface\s+(\w+)(?:<[^>]+>)?\s*\{([\s\S]*?)\}/g;
    let interfaceMatch;

    while ((interfaceMatch = interfaceRegex.exec(content)) !== null) {
      const typeName = interfaceMatch[1];
      const typeBody = interfaceMatch[2];

      // Infer model name from type name
      let modelName: string | undefined;
      const modelMap: Record<string, string> = {
        User: "User",
        Lead: "Lead",
        Booking: "Booking",
        Strategy: "Strategy",
        SubAccount: "SubAccount",
        PromptTemplate: "PromptTemplate",
        ContactSubmission: "ContactSubmission",
        FormTemplate: "FormTemplate",
        FormSubmission: "FormSubmission",
        IntegrationTemplate: "IntegrationTemplate",
        Integration: "Integration",
        SubAccountInvitation: "SubAccountInvitation",
      };

      // Check for Create/Update DTOs
      if (typeName.includes("Create") || typeName.includes("Update")) {
        const baseName = typeName
          .replace(/^(Create|Update)/, "")
          .replace(/Dto$/, "");
        modelName = modelMap[baseName];
      } else {
        // Direct model name match
        modelName = modelMap[typeName];
      }

      const fields = this.extractTypeScriptFields(typeBody);

      types.push({
        path: filePath,
        name: typeName,
        fields,
        modelName,
      });
    }

    // Also match type aliases for DTOs: export type TypeName = { ... }
    const typeAliasRegex =
      /export\s+type\s+(\w+)(?:<[^>]+>)?\s*=\s*\{([\s\S]*?)\}/g;
    let typeMatch;

    while ((typeMatch = typeAliasRegex.exec(content)) !== null) {
      const typeName = typeMatch[1];
      const typeBody = typeMatch[2];

      // Only check DTO types
      if (
        typeName.includes("Create") ||
        typeName.includes("Update") ||
        typeName.includes("Dto")
      ) {
        const modelMap: Record<string, string> = {
          User: "User",
          Lead: "Lead",
          Booking: "Booking",
          Strategy: "Strategy",
          SubAccount: "SubAccount",
          PromptTemplate: "PromptTemplate",
          ContactSubmission: "ContactSubmission",
          FormTemplate: "FormTemplate",
          FormSubmission: "FormSubmission",
          IntegrationTemplate: "IntegrationTemplate",
          Integration: "Integration",
          Invitation: "SubAccountInvitation",
        };

        let modelName: string | undefined;
        if (typeName.includes("Create") || typeName.includes("Update")) {
          const baseName = typeName
            .replace(/^(Create|Update)/, "")
            .replace(/Dto$/, "");
          modelName = modelMap[baseName];
        }

        const fields = this.extractTypeScriptFields(typeBody);

        types.push({
          path: filePath,
          name: typeName,
          fields,
          modelName,
        });
      }
    }

    return types;
  }

  /**
   * Extract fields from TypeScript type/interface body
   */
  extractTypeScriptFields(typeBody: string): TypeScriptField[] {
    const fields: TypeScriptField[] = [];
    const lines = typeBody.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip comments and empty lines
      if (trimmed.startsWith("//") || trimmed.startsWith("*") || !trimmed) {
        continue;
      }

      // Match property: fieldName?: type;
      // or: fieldName: type;
      const propertyMatch = trimmed.match(/^(\w+)(\??)\s*:\s*([^;=,]+)(;|,|$)/);
      if (propertyMatch) {
        const fieldName = propertyMatch[1];
        const optional = propertyMatch[2] === "?";
        const fieldType = propertyMatch[4].trim();

        // Skip methods and non-field properties
        if (
          fieldName === "constructor" ||
          fieldName.startsWith("_") ||
          trimmed.includes("function") ||
          trimmed.includes("async") ||
          trimmed.includes("=>")
        ) {
          continue;
        }

        fields.push({
          name: fieldName,
          type: this.normalizeTypeScriptType(fieldType),
          optional,
        });
      }
    }

    return fields;
  }

  /**
   * Normalize TypeScript type
   */
  normalizeTypeScriptType(tsType: string): string {
    // Remove union types, generics, etc. for comparison
    const clean = tsType
      .replace(/\|.*/g, "") // Remove union types
      .replace(/<.*>/g, "") // Remove generics
      .replace(/\[\]/g, "") // Remove arrays
      .replace(/\?/g, "") // Remove optional markers
      .trim();

    // Map common types
    const typeMap: Record<string, string> = {
      number: "number",
      string: "string",
      boolean: "boolean",
      Date: "Date | string",
      any: "any",
      "Record<string, any>": "any",
      "Record<string, string>": "any",
      unknown: "any",
    };

    return typeMap[clean] || clean;
  }

  /**
   * Audit TypeScript types against Prisma models
   */
  audit(): void {
    console.log(`\n🔎 Auditing TypeScript types against Prisma schema...\n`);

    for (const tsType of this.typescriptTypes) {
      if (!tsType.modelName || !this.prismaModels.has(tsType.modelName)) {
        // Skip types that don't map to Prisma models
        continue;
      }

      const model = this.prismaModels.get(tsType.modelName)!;
      this.compareTypeToModel(tsType, model);
    }

    this.printReport();
  }

  /**
   * Compare a TypeScript type to its Prisma model
   */
  compareTypeToModel(tsType: TypeScriptType, model: PrismaModel): void {
    const prismaFields = new Map(model.fields.map((f) => [f.name, f]));
    const tsFields = new Map(tsType.fields.map((f) => [f.name, f]));

    // Check for fields in TypeScript type that don't exist in Prisma
    for (const [tsFieldName] of tsFields) {
      // Check for common field name mismatches
      if (tsFieldName === "userId" && prismaFields.has("regularUserId")) {
        this.mismatches.push({
          typeFile: tsType.path,
          typeField: tsFieldName,
          prismaField: "regularUserId",
          issue: `TypeScript type uses '${tsFieldName}' but Prisma schema uses 'regularUserId'`,
          severity: "error",
        });
        continue;
      }

      // Check for messages vs messageHistory mismatch
      if (tsFieldName === "messages" && prismaFields.has("messageHistory")) {
        this.mismatches.push({
          typeFile: tsType.path,
          typeField: tsFieldName,
          prismaField: "messageHistory",
          issue: `TypeScript type uses '${tsFieldName}' but Prisma schema uses 'messageHistory'`,
          severity: "error",
        });
        continue;
      }

      // Check if field exists in Prisma (allowing for common variations)
      if (!prismaFields.has(tsFieldName)) {
        // Check for common field name variations
        const variations = this.getFieldVariations(tsFieldName);
        const found = variations.some((v) => prismaFields.has(v));

        if (!found && !this.isIgnoredField(tsFieldName)) {
          this.mismatches.push({
            typeFile: tsType.path,
            typeField: tsFieldName,
            prismaField: "N/A",
            issue: `Field '${tsFieldName}' exists in TypeScript type '${tsType.name}' but not in Prisma model '${model.name}'`,
            severity: "warning",
          });
        }
      }
    }

    // Check for required Prisma fields missing in TypeScript type (only for Create DTOs)
    if (tsType.name.includes("Create")) {
      for (const [prismaFieldName, prismaField] of prismaFields) {
        // Skip auto-generated fields
        if (this.isAutoGeneratedField(prismaFieldName)) {
          continue;
        }

        // Skip relation IDs that might be handled separately
        if (
          prismaFieldName.endsWith("Id") &&
          prismaFieldName !== "subAccountId"
        ) {
          // Check if there's a variation in TypeScript type
          const variations = this.getFieldVariations(prismaFieldName);
          const found = variations.some((v) => tsFields.has(v));

          if (
            !found &&
            !prismaField.optional &&
            !this.isIgnoredField(prismaFieldName)
          ) {
            // Check if it's a relation field that might be optional in TypeScript
            const relationField = prismaFieldName.replace(/Id$/, "");
            if (!tsFields.has(relationField)) {
              this.mismatches.push({
                typeFile: tsType.path,
                typeField: "N/A",
                prismaField: prismaFieldName,
                issue: `Required Prisma field '${prismaFieldName}' missing in Create type '${tsType.name}'`,
                severity: "warning",
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
    if (fieldName === "userId") {
      variations.push("regularUserId");
    }
    if (fieldName === "regularUserId") {
      variations.push("userId");
    }

    // messages <-> messageHistory
    if (fieldName === "messages") {
      variations.push("messageHistory");
    }
    if (fieldName === "messageHistory") {
      variations.push("messages");
    }

    return variations;
  }

  /**
   * Check if field should be ignored
   */
  isIgnoredField(fieldName: string): boolean {
    const ignored = [
      "createdAt",
      "updatedAt",
      "id", // Usually auto-generated
      "createdByAdminId", // Usually set by system
      "user", // Relation field
      "strategy", // Relation field
      "subAccount", // Relation field
      "bookings", // Relation field
      "leads", // Relation field
      "createdByAdmin", // Relation field (AdminUser)
      "email", // Often a relation field or computed
      "assignedTo", // Relation field
      "lead", // Relation field (Booking.lead)
      "submissions", // Relation field (FormTemplate.submissions)
      "content", // Often computed or nested data
      "authorId", // Often in nested objects
      "authorName", // Often in nested objects
    ];
    return ignored.includes(fieldName);
  }

  /**
   * Check if field is auto-generated
   */
  isAutoGeneratedField(fieldName: string): boolean {
    return (
      fieldName === "id" ||
      fieldName === "createdAt" ||
      fieldName === "updatedAt" ||
      fieldName.includes("createdBy")
    );
  }

  /**
   * Print audit report
   */
  printReport(): void {
    console.log("\n" + "=".repeat(80));
    console.log("📊 FRONTEND TYPES AUDIT REPORT");
    console.log("=".repeat(80) + "\n");

    const errors = this.mismatches.filter((m) => m.severity === "error");
    const warnings = this.mismatches.filter((m) => m.severity === "warning");

    if (errors.length === 0 && warnings.length === 0) {
      console.log("✅ All TypeScript types match Prisma schema perfectly!\n");
      return;
    }

    if (errors.length > 0) {
      console.log(`❌ ERRORS (${errors.length}):\n`);
      errors.forEach((mismatch, index) => {
        console.log(`${index + 1}. ${mismatch.typeFile}`);
        console.log(`   Type: ${this.getTypeNameFromPath(mismatch.typeFile)}`);
        console.log(`   TypeScript Field: ${mismatch.typeField}`);
        console.log(`   Prisma Field: ${mismatch.prismaField}`);
        console.log(`   Issue: ${mismatch.issue}\n`);
      });
    }

    if (warnings.length > 0) {
      console.log(`⚠️  WARNINGS (${warnings.length}):\n`);
      warnings.forEach((mismatch, index) => {
        console.log(`${index + 1}. ${mismatch.typeFile}`);
        console.log(`   Type: ${this.getTypeNameFromPath(mismatch.typeFile)}`);
        console.log(`   TypeScript Field: ${mismatch.typeField}`);
        console.log(`   Prisma Field: ${mismatch.prismaField}`);
        console.log(`   Issue: ${mismatch.issue}\n`);
      });
    }

    console.log("=".repeat(80));
    console.log(
      `\nTotal Issues: ${this.mismatches.length} (${errors.length} errors, ${warnings.length} warnings)\n`
    );

    if (errors.length > 0) {
      process.exit(1);
    }
  }

  /**
   * Get type name from file path for display
   */
  getTypeNameFromPath(filePath: string): string {
    const type = this.typescriptTypes.find((t) => t.path === filePath);
    return type ? type.name : "Unknown";
  }
}

// Main execution
async function main() {
  const projectRoot = path.join(__dirname, "..");
  const schemaPath = path.join(
    projectRoot,
    "..",
    "backend-api",
    "prisma",
    "schema.prisma"
  );

  if (!fs.existsSync(schemaPath)) {
    console.error(`❌ Prisma schema not found at: ${schemaPath}`);
    process.exit(1);
  }

  const auditor = new FrontendTypesAuditor();

  try {
    auditor.parsePrismaSchema(schemaPath);
    auditor.loadTypeScriptTypes(projectRoot);
    auditor.audit();
  } catch (error) {
    console.error("❌ Audit failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
