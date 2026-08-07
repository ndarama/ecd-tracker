-- CreateTable
CREATE TABLE "Caregiver" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "village" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Child" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" DATETIME NOT NULL,
    "gender" TEXT NOT NULL,
    "village" TEXT NOT NULL,
    "caregiverName" TEXT NOT NULL,
    "caregiverPhone" TEXT,
    "caregiverId" TEXT,
    "chwId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Child_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Child_chwId_fkey" FOREIGN KEY ("chwId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Child" ("caregiverName", "caregiverPhone", "chwId", "createdAt", "dateOfBirth", "firstName", "gender", "id", "lastName", "updatedAt", "village") SELECT "caregiverName", "caregiverPhone", "chwId", "createdAt", "dateOfBirth", "firstName", "gender", "id", "lastName", "updatedAt", "village" FROM "Child";
DROP TABLE "Child";
ALTER TABLE "new_Child" RENAME TO "Child";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Caregiver_phone_key" ON "Caregiver"("phone");
