/*
  Warnings:

  - Made the column `promptTemplateId` on table `Strategy` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Strategy" DROP CONSTRAINT "Strategy_promptTemplateId_fkey";

-- AlterTable
ALTER TABLE "Strategy" ALTER COLUMN "promptTemplateId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Strategy" ADD CONSTRAINT "Strategy_promptTemplateId_fkey" FOREIGN KEY ("promptTemplateId") REFERENCES "PromptTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
