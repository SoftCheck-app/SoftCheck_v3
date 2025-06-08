-- CreateTable: Add teamId to Employee and SoftwareDatabase for team separation

-- First, add the teamId column as nullable to Employee
ALTER TABLE "Employee" ADD COLUMN "teamId" TEXT;

-- First, add the teamId column as nullable to SoftwareDatabase
ALTER TABLE "SoftwareDatabase" ADD COLUMN "teamId" TEXT;

-- Get the first team ID to use as default (assuming there's at least one team)
-- This is a temporary measure for existing data
UPDATE "Employee" SET "teamId" = (SELECT "id" FROM "Team" LIMIT 1) WHERE "teamId" IS NULL;
UPDATE "SoftwareDatabase" SET "teamId" = (SELECT "id" FROM "Team" LIMIT 1) WHERE "teamId" IS NULL;

-- Now make the columns NOT NULL
ALTER TABLE "Employee" ALTER COLUMN "teamId" SET NOT NULL;
ALTER TABLE "SoftwareDatabase" ALTER COLUMN "teamId" SET NOT NULL;

-- Add foreign key constraints
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SoftwareDatabase" ADD CONSTRAINT "SoftwareDatabase_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for better performance
CREATE INDEX "Employee_teamId_idx" ON "Employee"("teamId");
CREATE INDEX "SoftwareDatabase_teamId_idx" ON "SoftwareDatabase"("teamId");
CREATE INDEX "SoftwareDatabase_deviceId_idx" ON "SoftwareDatabase"("deviceId");
CREATE INDEX "SoftwareDatabase_userId_idx" ON "SoftwareDatabase"("userId"); 