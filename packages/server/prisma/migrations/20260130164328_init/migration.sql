-- CreateTable
CREATE TABLE "prep_packs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "startupName" TEXT,
    "investorName" TEXT,
    "startupProfileText" TEXT NOT NULL,
    "investorProfileText" TEXT NOT NULL,
    "resultJson" JSONB NOT NULL,
    "model" TEXT,
    "tokensUsed" INTEGER,

    CONSTRAINT "prep_packs_pkey" PRIMARY KEY ("id")
);
