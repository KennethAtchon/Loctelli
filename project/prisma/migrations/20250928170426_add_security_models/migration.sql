-- CreateTable
CREATE TABLE "public"."conversation_messages" (
    "id" TEXT NOT NULL,
    "leadId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "encryptedContent" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "integrityHash" TEXT NOT NULL,
    "validationScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "messageTimestamp" TIMESTAMP(3) NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."security_incidents" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "leadId" INTEGER,
    "messageId" TEXT,
    "userId" INTEGER,
    "metadata" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_incidents_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."conversation_messages" ADD CONSTRAINT "conversation_messages_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
