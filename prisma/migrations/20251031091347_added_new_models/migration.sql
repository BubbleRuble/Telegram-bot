-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'LEFT', 'BANNED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "TelegramUser" (
    "id" BIGINT NOT NULL,
    "username" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivatedAt" TIMESTAMP(3),
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockedAt" TIMESTAMP(3),
    "unblockedAt" TIMESTAMP(3),
    "blockedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramSession" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "chatId" BIGINT NOT NULL,
    "language" VARCHAR(10),
    "preferences" JSONB,
    "lastInteractionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hashedToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ip" TEXT,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramUser_username_key" ON "TelegramUser"("username");

-- CreateIndex
CREATE INDEX "TelegramUser_username_idx" ON "TelegramUser"("username");

-- CreateIndex
CREATE INDEX "TelegramUser_isActive_updatedAt_idx" ON "TelegramUser"("isActive", "updatedAt");

-- CreateIndex
CREATE INDEX "TelegramUser_status_idx" ON "TelegramUser"("status");

-- CreateIndex
CREATE INDEX "TelegramUser_isBlocked_idx" ON "TelegramUser"("isBlocked");

-- CreateIndex
CREATE INDEX "TelegramSession_chatId_idx" ON "TelegramSession"("chatId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramSession_userId_chatId_key" ON "TelegramSession"("userId", "chatId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_hashedToken_key" ON "RefreshToken"("hashedToken");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- AddForeignKey
ALTER TABLE "TelegramSession" ADD CONSTRAINT "TelegramSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "TelegramUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
