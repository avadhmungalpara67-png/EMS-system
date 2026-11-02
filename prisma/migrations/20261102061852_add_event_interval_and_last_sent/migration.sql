-- AlterTable
ALTER TABLE "NotificationEvent" ADD COLUMN     "intervalSeconds" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "lastSentAt" TIMESTAMP(3);
