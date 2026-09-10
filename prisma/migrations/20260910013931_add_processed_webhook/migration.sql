/*
  Warnings:

  - You are about to drop the column `eventType` on the `ProcessedWebhook` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ProcessedWebhook" DROP COLUMN "eventType";
