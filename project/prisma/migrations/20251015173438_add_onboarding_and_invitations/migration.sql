-- CreateTable
CREATE TABLE "public"."subaccount_invitations" (
    "id" TEXT NOT NULL,
    "subAccountId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "password" TEXT,
    "maxUses" INTEGER,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByAdminId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subaccount_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subaccount_invitations_code_key" ON "public"."subaccount_invitations"("code");

-- CreateIndex
CREATE INDEX "subaccount_invitations_code_idx" ON "public"."subaccount_invitations"("code");

-- CreateIndex
CREATE INDEX "subaccount_invitations_subAccountId_idx" ON "public"."subaccount_invitations"("subAccountId");

-- AddForeignKey
ALTER TABLE "public"."subaccount_invitations" ADD CONSTRAINT "subaccount_invitations_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "public"."SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subaccount_invitations" ADD CONSTRAINT "subaccount_invitations_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "public"."AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
