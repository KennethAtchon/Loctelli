-- AlterTable
ALTER TABLE "public"."Lead" ADD COLUMN     "timezone" TEXT;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/New_York';
