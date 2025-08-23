-- Ensure UUID generator is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Restore DEFAULT for id so trigger inserts succeed
ALTER TABLE "public"."SubAgentUpdateHistory"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- Ensure createdAt keeps a default
ALTER TABLE "public"."SubAgentUpdateHistory"
  ALTER COLUMN "createdAt" SET DEFAULT now();

-- Recreate index if it was dropped previously
CREATE INDEX IF NOT EXISTS "SubAgentUpdateHistory_subAgentId_createdAt_idx"
  ON "public"."SubAgentUpdateHistory" ("subAgentId", "createdAt");


