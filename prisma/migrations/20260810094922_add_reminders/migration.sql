-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "immunizationId" TEXT,
    "homeVisitId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dueDate" DATETIME NOT NULL,
    "caregiverName" TEXT NOT NULL,
    "caregiverPhone" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reminder_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reminder_immunizationId_fkey" FOREIGN KEY ("immunizationId") REFERENCES "Immunization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reminder_homeVisitId_fkey" FOREIGN KEY ("homeVisitId") REFERENCES "HomeVisit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Reminder_childId_status_dueDate_idx" ON "Reminder"("childId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "Reminder_immunizationId_idx" ON "Reminder"("immunizationId");

-- CreateIndex
CREATE INDEX "Reminder_homeVisitId_idx" ON "Reminder"("homeVisitId");
