-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "messageKey" TEXT,
ADD COLUMN     "params" JSONB,
ADD COLUMN     "titleKey" TEXT;
