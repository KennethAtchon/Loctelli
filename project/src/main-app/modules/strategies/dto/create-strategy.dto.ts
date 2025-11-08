import { IsString, IsOptional, IsInt, IsJSON, IsNumber, IsNotEmpty, IsBoolean } from 'class-validator';

export class CreateStrategyDto {
  @IsInt()
  regularUserId: number;

  @IsInt()
  promptTemplateId: number;

  // ===== CORE IDENTITY =====
  @IsString()
  @IsNotEmpty()
  name: string; // "Mike - Roofing Storm Damage"

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  tag?: string; // "roofing"

  @IsString()
  @IsOptional()
  industryContext?: string; // "Roofing - Storm Damage"

  // ===== PERSONA DETAILS =====
  @IsString()
  @IsNotEmpty()
  aiName: string; // "Mike"

  @IsString()
  @IsNotEmpty()
  aiRole: string; // "Senior Roofing Consultant with 15 years experience..."

  @IsString()
  @IsOptional()
  companyBackground?: string; // "15 years in business, GAF Master Elite, BBB A+..."

  // ===== CONVERSATION STYLE =====
  @IsString()
  @IsNotEmpty()
  conversationTone: string; // "Assertive, direct, urgency-focused. Use phrases like..."

  @IsString()
  @IsOptional()
  communicationStyle?: string; // "Take control naturally, be empathetic but honest..."

  // ===== QUALIFICATION & DISCOVERY =====
  @IsString()
  @IsNotEmpty()
  qualificationQuestions: string; // "1. What type of issue? 2. When noticed? 3. Budget?..."

  @IsString()
  @IsOptional()
  disqualificationRules?: string; // "Budget under $10k: refer to specialists..."

  // ===== OBJECTION HANDLING =====
  @IsString()
  @IsNotEmpty()
  objectionHandling: string; // "PRICE: 'Here's the reality...' TIMING: '...'"

  // ===== CLOSING & BOOKING =====
  @IsString()
  @IsNotEmpty()
  closingStrategy: string; // "Use assumptive close. After budget confirmed..."

  @IsString()
  @IsOptional()
  bookingInstructions?: string; // "Offer specific time slots, create urgency..."

  // ===== OUTPUT RULES =====
  @IsString()
  @IsOptional()
  outputGuidelines?: string; // "Keep responses 2-4 sentences, always end with question..."

  @IsString()
  @IsOptional()
  prohibitedBehaviors?: string; // "Don't be pushy, don't badmouth competitors..."

  // ===== OPTIONAL STRUCTURED DATA =====
  @IsJSON()
  @IsOptional()
  metadata?: any; // Any additional data for analytics/filtering

  // ===== BEHAVIORAL SETTINGS =====
  @IsInt()
  @IsOptional()
  delayMin?: number;

  @IsInt()
  @IsOptional()
  delayMax?: number;

  // ===== METADATA =====
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  subAccountId?: number;
}
