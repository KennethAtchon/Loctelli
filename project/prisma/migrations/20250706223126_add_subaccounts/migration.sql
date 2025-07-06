/*
  Warnings:

  - Added the required column `subAccountId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subAccountId` to the `Lead` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subAccountId` to the `Strategy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subAccountId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "subAccountId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "subAccountId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Strategy" ADD COLUMN     "subAccountId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "subAccountId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "SubAccount" (
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

-- AddForeignKey
ALTER TABLE "SubAccount" ADD CONSTRAINT "SubAccount_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Strategy" ADD CONSTRAINT "Strategy_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
