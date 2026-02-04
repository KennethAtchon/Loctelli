-- CreateTable
CREATE TABLE "form_sessions" (
    "id" TEXT NOT NULL,
    "formTemplateId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "currentCardIndex" INTEGER NOT NULL DEFAULT 0,
    "partialData" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "deviceType" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "timePerCard" JSONB,
    "subAccountId" INTEGER NOT NULL,

    CONSTRAINT "form_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "form_sessions_sessionToken_key" ON "form_sessions"("sessionToken");

-- AddForeignKey
ALTER TABLE "form_sessions" ADD CONSTRAINT "form_sessions_formTemplateId_fkey" FOREIGN KEY ("formTemplateId") REFERENCES "form_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_sessions" ADD CONSTRAINT "form_sessions_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
