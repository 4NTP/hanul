/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `SubAgent` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."SubAgent" ADD COLUMN     "name" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "SubAgent_name_key" ON "public"."SubAgent"("name");
