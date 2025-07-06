-- Migration: Add SubAccounts functionality
-- This migration adds the SubAccount model and updates existing models

-- 1. Create SubAccount table
CREATE TABLE "SubAccount" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByAdminId" INTEGER NOT NULL,
    FOREIGN KEY ("createdByAdminId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 2. Add subAccountId to existing tables
ALTER TABLE "User" ADD COLUMN "subAccountId" INTEGER;
ALTER TABLE "Strategy" ADD COLUMN "subAccountId" INTEGER;
ALTER TABLE "Lead" ADD COLUMN "subAccountId" INTEGER;
ALTER TABLE "Booking" ADD COLUMN "subAccountId" INTEGER;

-- 3. Create default SubAccount for existing data
INSERT INTO "SubAccount" ("name", "description", "isActive", "createdByAdminId", "createdAt", "updatedAt")
SELECT 'Default SubAccount', 'Default SubAccount for existing data', true, 
       (SELECT MIN(id) FROM "AdminUser" WHERE "role" = 'super_admin'),
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
LIMIT 1;

-- 4. Migrate existing data to default SubAccount
UPDATE "User" SET "subAccountId" = (SELECT id FROM "SubAccount" WHERE "name" = 'Default SubAccount' LIMIT 1);
UPDATE "Strategy" SET "subAccountId" = (SELECT id FROM "SubAccount" WHERE "name" = 'Default SubAccount' LIMIT 1);
UPDATE "Lead" SET "subAccountId" = (SELECT id FROM "SubAccount" WHERE "name" = 'Default SubAccount' LIMIT 1);
UPDATE "Booking" SET "subAccountId" = (SELECT id FROM "SubAccount" WHERE "name" = 'Default SubAccount' LIMIT 1);

-- 5. Make subAccountId required
ALTER TABLE "User" ALTER COLUMN "subAccountId" SET NOT NULL;
ALTER TABLE "Strategy" ALTER COLUMN "subAccountId" SET NOT NULL;
ALTER TABLE "Lead" ALTER COLUMN "subAccountId" SET NOT NULL;
ALTER TABLE "Booking" ALTER COLUMN "subAccountId" SET NOT NULL;

-- 6. Add foreign key constraints
ALTER TABLE "User" ADD CONSTRAINT "User_subAccountId_fkey" 
    FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Strategy" ADD CONSTRAINT "Strategy_subAccountId_fkey" 
    FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_subAccountId_fkey" 
    FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_subAccountId_fkey" 
    FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 7. Remove old createdByAdminId from User (now handled through SubAccount)
ALTER TABLE "User" DROP COLUMN "createdByAdminId";

-- 8. Add indexes for performance
CREATE INDEX "User_subAccountId_idx" ON "User"("subAccountId");
CREATE INDEX "Strategy_subAccountId_idx" ON "Strategy"("subAccountId");
CREATE INDEX "Lead_subAccountId_idx" ON "Lead"("subAccountId");
CREATE INDEX "Booking_subAccountId_idx" ON "Booking"("subAccountId");
CREATE INDEX "SubAccount_createdByAdminId_idx" ON "SubAccount"("createdByAdminId"); 