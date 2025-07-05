-- AlterTable
ALTER TABLE "Strategy" ADD COLUMN     "promptTemplateId" INTEGER;

-- AddForeignKey
ALTER TABLE "Strategy" ADD CONSTRAINT "Strategy_promptTemplateId_fkey" FOREIGN KEY ("promptTemplateId") REFERENCES "PromptTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
