-- Add authentication fields to User table
ALTER TABLE "User" 
ADD COLUMN "password" TEXT NOT NULL DEFAULT 'temp_password',
ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user',
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "lastLoginAt" TIMESTAMP(3),
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Make email unique and required
ALTER TABLE "User" 
ALTER COLUMN "email" SET NOT NULL;

-- Add unique constraint on email
ALTER TABLE "User" 
ADD CONSTRAINT "User_email_key" UNIQUE ("email");

-- Update existing users with default values
UPDATE "User" 
SET 
  "password" = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8e', -- 'password123'
  "role" = 'admin',
  "isActive" = true
WHERE "email" IS NOT NULL;

-- Remove the default constraint after updating
ALTER TABLE "User" 
ALTER COLUMN "password" DROP DEFAULT; 