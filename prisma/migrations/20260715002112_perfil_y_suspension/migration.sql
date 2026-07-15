-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar" BYTEA,
ADD COLUMN     "avatarMimeType" TEXT,
ADD COLUMN     "avatarUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "suspendedAt" TIMESTAMP(3);
