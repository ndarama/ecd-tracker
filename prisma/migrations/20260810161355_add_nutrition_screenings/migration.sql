-- CreateTable
CREATE TABLE "NutritionScreening" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "mealDescription" TEXT NOT NULL,
    "feedingHabits" TEXT NOT NULL,
    "breastfeedingStatus" TEXT NOT NULL,
    "nutritionConcerns" TEXT,
    "recommendedSupport" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NutritionScreening_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "NutritionScreening_childId_date_idx" ON "NutritionScreening"("childId", "date");
