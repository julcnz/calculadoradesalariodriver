-- CreateTable
CREATE TABLE "SharedWeek" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "SharedWeek_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedWeek_tokenHash_key" ON "SharedWeek"("tokenHash");

-- CreateIndex
CREATE INDEX "SharedWeek_userId_idx" ON "SharedWeek"("userId");

-- AddForeignKey
ALTER TABLE "SharedWeek" ADD CONSTRAINT "SharedWeek_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
