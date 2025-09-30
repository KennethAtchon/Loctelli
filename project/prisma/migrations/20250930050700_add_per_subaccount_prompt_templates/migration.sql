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

-- CreateIndex
CREATE INDEX "SubAccountPromptTemplate_subAccountId_isActive_idx" ON "public"."SubAccountPromptTemplate"("subAccountId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SubAccountPromptTemplate_subAccountId_promptTemplateId_key" ON "public"."SubAccountPromptTemplate"("subAccountId", "promptTemplateId");

-- AddForeignKey
ALTER TABLE "public"."SubAccountPromptTemplate" ADD CONSTRAINT "SubAccountPromptTemplate_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "public"."SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubAccountPromptTemplate" ADD CONSTRAINT "SubAccountPromptTemplate_promptTemplateId_fkey" FOREIGN KEY ("promptTemplateId") REFERENCES "public"."PromptTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
