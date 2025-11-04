/*
  Warnings:

  - A unique constraint covering the columns `[telegramId]` on the table `TelegramUser` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "TelegramUser" ADD COLUMN     "telegramId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "TelegramUser_telegramId_key" ON "TelegramUser"("telegramId");
