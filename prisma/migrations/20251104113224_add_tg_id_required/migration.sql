/*
  Warnings:

  - Made the column `telegramId` on table `TelegramUser` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "TelegramUser" ALTER COLUMN "telegramId" SET NOT NULL;
