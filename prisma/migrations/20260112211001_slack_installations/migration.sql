/*
  Warnings:

  - You are about to drop the `Installation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Installation";

-- CreateTable
CREATE TABLE "SlackInstallation" (
    "id" TEXT NOT NULL,
    "enterpriseId" TEXT,
    "teamId" TEXT,
    "appId" TEXT,
    "botUserId" TEXT,
    "userId" TEXT,
    "installation" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SlackInstallation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SlackInstallation_enterpriseId_teamId_key" ON "SlackInstallation"("enterpriseId", "teamId");
