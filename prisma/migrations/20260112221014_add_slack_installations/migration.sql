/*
  Warnings:

  - You are about to drop the `SlackInstallation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "SlackInstallation";

-- CreateTable
CREATE TABLE "Installation" (
    "id" TEXT NOT NULL,
    "enterpriseId" TEXT,
    "teamId" TEXT,
    "botToken" TEXT NOT NULL,
    "botId" TEXT,
    "botUserId" TEXT,
    "installerUser" TEXT,
    "scope" TEXT,
    "appId" TEXT,
    "tokenType" TEXT DEFAULT 'bot',
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Installation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Installation_enterpriseId_idx" ON "Installation"("enterpriseId");

-- CreateIndex
CREATE INDEX "Installation_teamId_idx" ON "Installation"("teamId");
