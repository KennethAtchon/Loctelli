-- CreateEnum
CREATE TYPE "public"."ContactStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'CLOSED_WON', 'CLOSED_LOST', 'UNRESPONSIVE');

-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "public"."AdminUser" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "permissions" JSONB,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SubAccount" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByAdminId" INTEGER NOT NULL,

    CONSTRAINT "SubAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "company" TEXT,
    "budget" TEXT,
    "bookingsTime" JSONB,
    "bookingEnabled" INTEGER NOT NULL DEFAULT 1,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "calendarId" TEXT,
    "locationId" TEXT,
    "assignedUserId" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subAccountId" INTEGER NOT NULL,
    "createdByAdminId" INTEGER,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Strategy" (
    "id" SERIAL NOT NULL,
    "regularUserId" INTEGER NOT NULL,
    "subAccountId" INTEGER NOT NULL,
    "promptTemplateId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tag" TEXT,
    "industryContext" TEXT,
    "aiName" TEXT NOT NULL,
    "aiRole" TEXT NOT NULL,
    "companyBackground" TEXT,
    "conversationTone" TEXT NOT NULL,
    "communicationStyle" TEXT,
    "qualificationQuestions" TEXT NOT NULL,
    "disqualificationRules" TEXT,
    "objectionHandling" TEXT NOT NULL,
    "closingStrategy" TEXT NOT NULL,
    "bookingInstructions" TEXT,
    "outputGuidelines" TEXT,
    "prohibitedBehaviors" TEXT,
    "metadata" JSONB,
    "delayMin" INTEGER,
    "delayMax" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Strategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Lead" (
    "id" SERIAL NOT NULL,
    "regularUserId" INTEGER NOT NULL,
    "strategyId" INTEGER NOT NULL,
    "subAccountId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "position" TEXT,
    "customId" TEXT,
    "timezone" TEXT,
    "messageHistory" JSONB,
    "status" TEXT NOT NULL DEFAULT 'lead',
    "notes" TEXT,
    "lastMessage" TEXT,
    "lastMessageDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Booking" (
    "id" SERIAL NOT NULL,
    "regularUserId" INTEGER NOT NULL,
    "leadId" INTEGER,
    "subAccountId" INTEGER NOT NULL,
    "bookingType" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PromptTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "baseSystemPrompt" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION DEFAULT 0.7,
    "maxTokens" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByAdminId" INTEGER NOT NULL,

    CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SubAccountPromptTemplate" (
    "id" SERIAL NOT NULL,
    "subAccountId" INTEGER NOT NULL,
    "promptTemplateId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubAccountPromptTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IntegrationTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "configSchema" JSONB NOT NULL,
    "setupInstructions" TEXT,
    "webhookUrl" TEXT,
    "apiVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByAdminId" INTEGER NOT NULL,

    CONSTRAINT "IntegrationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Integration" (
    "id" SERIAL NOT NULL,
    "subAccountId" INTEGER NOT NULL,
    "integrationTemplateId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "lastSyncAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "webhookSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByAdminId" INTEGER NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SmsMessage" (
    "id" SERIAL NOT NULL,
    "regularUserId" INTEGER NOT NULL,
    "subAccountId" INTEGER NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "twilioSid" TEXT,
    "errorMessage" TEXT,
    "campaignId" INTEGER,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmsMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SmsCampaign" (
    "id" SERIAL NOT NULL,
    "regularUserId" INTEGER NOT NULL,
    "subAccountId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmsCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApiKey" (
    "id" SERIAL NOT NULL,
    "regularUserId" INTEGER,
    "service" TEXT NOT NULL,
    "keyName" TEXT NOT NULL,
    "keyValue" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "dailyLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BusinessSearch" (
    "id" TEXT NOT NULL,
    "regularUserId" INTEGER NOT NULL,
    "subAccountId" INTEGER NOT NULL,
    "query" TEXT NOT NULL,
    "location" TEXT,
    "radius" DOUBLE PRECISION,
    "category" TEXT,
    "searchHash" TEXT NOT NULL,
    "totalResults" INTEGER NOT NULL DEFAULT 0,
    "results" JSONB NOT NULL,
    "sources" JSONB NOT NULL,
    "responseTime" INTEGER,
    "apiCalls" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "errorMessage" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RateLimit" (
    "id" SERIAL NOT NULL,
    "regularUserId" INTEGER,
    "ipAddress" TEXT,
    "service" TEXT NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "dailyLimit" INTEGER NOT NULL DEFAULT 500,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "violations" INTEGER NOT NULL DEFAULT 0,
    "blockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contact_submissions" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "services" TEXT NOT NULL,
    "message" TEXT,
    "source" TEXT NOT NULL DEFAULT 'website',
    "status" "public"."ContactStatus" NOT NULL DEFAULT 'NEW',
    "priority" "public"."Priority" NOT NULL DEFAULT 'MEDIUM',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "followedUpAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "assignedToId" INTEGER,
    "notes" JSONB,
    "subAccountId" INTEGER NOT NULL,

    CONSTRAINT "contact_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."form_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "schema" JSONB NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "submitButtonText" TEXT NOT NULL DEFAULT 'Submit',
    "successMessage" TEXT NOT NULL DEFAULT 'Thank you for your submission!',
    "requiresWakeUp" BOOLEAN NOT NULL DEFAULT true,
    "wakeUpInterval" INTEGER NOT NULL DEFAULT 30,
    "subAccountId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByAdminId" INTEGER NOT NULL,

    CONSTRAINT "form_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."form_submissions" (
    "id" TEXT NOT NULL,
    "formTemplateId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "files" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "source" TEXT NOT NULL DEFAULT 'website',
    "status" TEXT NOT NULL DEFAULT 'new',
    "priority" "public"."Priority" NOT NULL DEFAULT 'MEDIUM',
    "assignedToId" INTEGER,
    "notes" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "contactedAt" TIMESTAMP(3),
    "subAccountId" INTEGER NOT NULL,

    CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."conversation_messages" (
    "id" TEXT NOT NULL,
    "leadId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "encryptedContent" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "integrityHash" TEXT NOT NULL,
    "validationScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "messageTimestamp" TIMESTAMP(3) NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."security_incidents" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "leadId" INTEGER,
    "messageId" TEXT,
    "userId" INTEGER,
    "metadata" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "public"."AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "Strategy_subAccountId_idx" ON "public"."Strategy"("subAccountId");

-- CreateIndex
CREATE INDEX "Strategy_regularUserId_idx" ON "public"."Strategy"("regularUserId");

-- CreateIndex
CREATE INDEX "Strategy_promptTemplateId_idx" ON "public"."Strategy"("promptTemplateId");

-- CreateIndex
CREATE INDEX "PromptTemplate_category_idx" ON "public"."PromptTemplate"("category");

-- CreateIndex
CREATE INDEX "PromptTemplate_createdByAdminId_idx" ON "public"."PromptTemplate"("createdByAdminId");

-- CreateIndex
CREATE INDEX "SubAccountPromptTemplate_subAccountId_isActive_idx" ON "public"."SubAccountPromptTemplate"("subAccountId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SubAccountPromptTemplate_subAccountId_promptTemplateId_key" ON "public"."SubAccountPromptTemplate"("subAccountId", "promptTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_regularUserId_service_keyName_key" ON "public"."ApiKey"("regularUserId", "service", "keyName");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessSearch_searchHash_key" ON "public"."BusinessSearch"("searchHash");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_regularUserId_service_key" ON "public"."RateLimit"("regularUserId", "service");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_ipAddress_service_key" ON "public"."RateLimit"("ipAddress", "service");

-- CreateIndex
CREATE UNIQUE INDEX "form_templates_slug_key" ON "public"."form_templates"("slug");

-- AddForeignKey
ALTER TABLE "public"."SubAccount" ADD CONSTRAINT "SubAccount_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "public"."AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "public"."SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "public"."AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Strategy" ADD CONSTRAINT "Strategy_regularUserId_fkey" FOREIGN KEY ("regularUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Strategy" ADD CONSTRAINT "Strategy_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "public"."SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Strategy" ADD CONSTRAINT "Strategy_promptTemplateId_fkey" FOREIGN KEY ("promptTemplateId") REFERENCES "public"."PromptTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lead" ADD CONSTRAINT "Lead_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "public"."SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lead" ADD CONSTRAINT "Lead_regularUserId_fkey" FOREIGN KEY ("regularUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lead" ADD CONSTRAINT "Lead_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "public"."Strategy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "public"."SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_regularUserId_fkey" FOREIGN KEY ("regularUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PromptTemplate" ADD CONSTRAINT "PromptTemplate_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "public"."AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubAccountPromptTemplate" ADD CONSTRAINT "SubAccountPromptTemplate_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "public"."SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubAccountPromptTemplate" ADD CONSTRAINT "SubAccountPromptTemplate_promptTemplateId_fkey" FOREIGN KEY ("promptTemplateId") REFERENCES "public"."PromptTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IntegrationTemplate" ADD CONSTRAINT "IntegrationTemplate_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "public"."AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Integration" ADD CONSTRAINT "Integration_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "public"."SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Integration" ADD CONSTRAINT "Integration_integrationTemplateId_fkey" FOREIGN KEY ("integrationTemplateId") REFERENCES "public"."IntegrationTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Integration" ADD CONSTRAINT "Integration_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "public"."AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SmsMessage" ADD CONSTRAINT "SmsMessage_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "public"."SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SmsMessage" ADD CONSTRAINT "SmsMessage_regularUserId_fkey" FOREIGN KEY ("regularUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SmsMessage" ADD CONSTRAINT "SmsMessage_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."SmsCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SmsCampaign" ADD CONSTRAINT "SmsCampaign_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "public"."SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SmsCampaign" ADD CONSTRAINT "SmsCampaign_regularUserId_fkey" FOREIGN KEY ("regularUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApiKey" ADD CONSTRAINT "ApiKey_regularUserId_fkey" FOREIGN KEY ("regularUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BusinessSearch" ADD CONSTRAINT "BusinessSearch_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "public"."SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BusinessSearch" ADD CONSTRAINT "BusinessSearch_regularUserId_fkey" FOREIGN KEY ("regularUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RateLimit" ADD CONSTRAINT "RateLimit_regularUserId_fkey" FOREIGN KEY ("regularUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contact_submissions" ADD CONSTRAINT "contact_submissions_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contact_submissions" ADD CONSTRAINT "contact_submissions_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "public"."SubAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."form_templates" ADD CONSTRAINT "form_templates_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "public"."SubAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."form_templates" ADD CONSTRAINT "form_templates_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "public"."AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."form_submissions" ADD CONSTRAINT "form_submissions_formTemplateId_fkey" FOREIGN KEY ("formTemplateId") REFERENCES "public"."form_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."form_submissions" ADD CONSTRAINT "form_submissions_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."form_submissions" ADD CONSTRAINT "form_submissions_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "public"."SubAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversation_messages" ADD CONSTRAINT "conversation_messages_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
