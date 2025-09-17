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

-- CreateIndex
CREATE UNIQUE INDEX "form_templates_slug_key" ON "public"."form_templates"("slug");

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
