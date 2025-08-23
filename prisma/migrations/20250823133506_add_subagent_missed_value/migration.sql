-- DropForeignKey
ALTER TABLE "public"."SubAgentUpdateHistory" DROP CONSTRAINT "SubAgentUpdateHistory_subAgentId_fkey";

-- DropIndex
DROP INDEX "public"."SubAgentUpdateHistory_subAgentId_createdAt_idx";

-- AlterTable
ALTER TABLE "public"."SubAgentUpdateHistory" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "public"."SubAgentUpdateHistory" ADD CONSTRAINT "SubAgentUpdateHistory_subAgentId_fkey" FOREIGN KEY ("subAgentId") REFERENCES "public"."SubAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
