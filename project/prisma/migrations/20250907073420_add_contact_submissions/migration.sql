-- CreateEnum
CREATE TYPE "public"."ContactStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'CLOSED_WON', 'CLOSED_LOST', 'UNRESPONSIVE');

-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

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

-- AddForeignKey
ALTER TABLE "public"."contact_submissions" ADD CONSTRAINT "contact_submissions_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contact_submissions" ADD CONSTRAINT "contact_submissions_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "public"."SubAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
