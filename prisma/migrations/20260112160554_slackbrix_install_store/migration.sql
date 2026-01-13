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
    "tokenType" TEXT,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Installation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Installation_enterpriseId_idx" ON "Installation"("enterpriseId");

-- CreateIndex
CREATE INDEX "Installation_teamId_idx" ON "Installation"("teamId");
