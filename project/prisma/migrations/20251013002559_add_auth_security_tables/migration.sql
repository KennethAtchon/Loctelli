-- CreateTable
CREATE TABLE "public"."auth_attempts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "failureReason" TEXT,
    "geoLocation" JSONB,
    "isNewLocation" BOOLEAN NOT NULL DEFAULT false,
    "isNewDevice" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."account_lockouts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_lockouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."password_history" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "accountType" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "accountType" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auth_attempts_email_accountType_createdAt_idx" ON "public"."auth_attempts"("email", "accountType", "createdAt");

-- CreateIndex
CREATE INDEX "auth_attempts_ipAddress_createdAt_idx" ON "public"."auth_attempts"("ipAddress", "createdAt");

-- CreateIndex
CREATE INDEX "auth_attempts_success_createdAt_idx" ON "public"."auth_attempts"("success", "createdAt");

-- CreateIndex
CREATE INDEX "account_lockouts_lockedUntil_idx" ON "public"."account_lockouts"("lockedUntil");

-- CreateIndex
CREATE INDEX "account_lockouts_email_accountType_idx" ON "public"."account_lockouts"("email", "accountType");

-- CreateIndex
CREATE UNIQUE INDEX "account_lockouts_email_accountType_key" ON "public"."account_lockouts"("email", "accountType");

-- CreateIndex
CREATE INDEX "password_history_userId_accountType_createdAt_idx" ON "public"."password_history"("userId", "accountType", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "public"."refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_accountType_idx" ON "public"."refresh_tokens"("userId", "accountType");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "public"."refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "refresh_tokens_tokenHash_idx" ON "public"."refresh_tokens"("tokenHash");
