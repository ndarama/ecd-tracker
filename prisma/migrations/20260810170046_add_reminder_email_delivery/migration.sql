-- AlterTable
ALTER TABLE "Caregiver" ADD COLUMN "email" TEXT;

-- AlterTable
ALTER TABLE "Reminder" ADD COLUMN "caregiverEmail" TEXT;
ALTER TABLE "Reminder" ADD COLUMN "deliveryError" TEXT;
ALTER TABLE "Reminder" ADD COLUMN "sentAt" DATETIME;
