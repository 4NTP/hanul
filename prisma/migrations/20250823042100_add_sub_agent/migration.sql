-- CreateTable
CREATE TABLE "public"."SubAgent" (
    "id" UUID NOT NULL,
    "prompt" TEXT NOT NULL,
    "chatId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubAgent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."SubAgent" ADD CONSTRAINT "SubAgent_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
