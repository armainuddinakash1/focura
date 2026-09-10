/*
  Warnings:

  - A unique constraint covering the columns `[webhookId]` on the table `ProcessedWebhook` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `eventType` to the `ProcessedWebhook` table without a default value. This is not possible if the table is not empty.
  - Added the required column `webhookId` to the `ProcessedWebhook` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProcessedWebhook" ADD COLUMN     "eventType" TEXT NOT NULL,
ADD COLUMN     "webhookId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ProcessedWebhook_webhookId_key" ON "ProcessedWebhook"("webhookId");
