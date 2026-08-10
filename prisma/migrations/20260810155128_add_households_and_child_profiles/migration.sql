/*
  Warnings:

  - You are about to drop the column `village` on the `Caregiver` table. All the data in the column will be lost.
  - You are about to drop the column `caregiverName` on the `Child` table. All the data in the column will be lost.
  - You are about to drop the column `caregiverPhone` on the `Child` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Household" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL,
    "village" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Caregiver" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "householdId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Caregiver_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Caregiver" ("createdAt", "id", "name", "phone", "updatedAt") SELECT "createdAt", "id", "name", "phone", "updatedAt" FROM "Caregiver";
DROP TABLE "Caregiver";
ALTER TABLE "new_Caregiver" RENAME TO "Caregiver";
CREATE UNIQUE INDEX "Caregiver_phone_key" ON "Caregiver"("phone");
CREATE TABLE "new_Child" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" DATETIME NOT NULL,
    "gender" TEXT NOT NULL,
    "village" TEXT NOT NULL,
    "profileImage" TEXT,
    "householdId" TEXT,
    "caregiverId" TEXT,
    "chwId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Child_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Child_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Child_chwId_fkey" FOREIGN KEY ("chwId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Child" ("caregiverId", "chwId", "createdAt", "dateOfBirth", "firstName", "gender", "id", "lastName", "updatedAt", "village") SELECT "caregiverId", "chwId", "createdAt", "dateOfBirth", "firstName", "gender", "id", "lastName", "updatedAt", "village" FROM "Child";
DROP TABLE "Child";
ALTER TABLE "new_Child" RENAME TO "Child";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
