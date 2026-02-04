-- CreateEnum
CREATE TYPE "FormType" AS ENUM ('SIMPLE', 'CARD');

-- AlterTable
ALTER TABLE "form_templates" ADD COLUMN     "analyticsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cardSettings" JSONB,
ADD COLUMN     "formType" "FormType" NOT NULL DEFAULT 'SIMPLE',
ADD COLUMN     "profileEstimation" JSONB,
ADD COLUMN     "styling" JSONB;
