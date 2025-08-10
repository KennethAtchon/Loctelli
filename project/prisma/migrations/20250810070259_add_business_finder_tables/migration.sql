-- CreateTable
CREATE TABLE "ApiKey" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "service" TEXT NOT NULL,
    "keyName" TEXT NOT NULL,
    "keyValue" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "dailyLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessSearch" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "subAccountId" INTEGER NOT NULL,
    "query" TEXT NOT NULL,
    "location" TEXT,
    "radius" DOUBLE PRECISION,
    "category" TEXT,
    "searchHash" TEXT NOT NULL,
    "totalResults" INTEGER NOT NULL DEFAULT 0,
    "results" JSONB NOT NULL,
    "sources" JSONB NOT NULL,
    "responseTime" INTEGER,
    "apiCalls" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "errorMessage" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "ipAddress" TEXT,
    "service" TEXT NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "dailyLimit" INTEGER NOT NULL DEFAULT 500,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "violations" INTEGER NOT NULL DEFAULT 0,
    "blockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_userId_service_keyName_key" ON "ApiKey"("userId", "service", "keyName");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessSearch_searchHash_key" ON "BusinessSearch"("searchHash");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_userId_service_key" ON "RateLimit"("userId", "service");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_ipAddress_service_key" ON "RateLimit"("ipAddress", "service");

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessSearch" ADD CONSTRAINT "BusinessSearch_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessSearch" ADD CONSTRAINT "BusinessSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateLimit" ADD CONSTRAINT "RateLimit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
