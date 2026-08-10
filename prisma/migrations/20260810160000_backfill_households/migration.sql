-- Backfill one household for each existing child that predates household management.
-- The deterministic id keeps the operation repeatable for the current SQLite database.
INSERT INTO "Household" ("id", "address", "village", "createdAt", "updatedAt")
SELECT 'household_' || "id", 'Not provided', "village", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Child"
WHERE "householdId" IS NULL;

UPDATE "Child"
SET "householdId" = 'household_' || "id"
WHERE "householdId" IS NULL;

UPDATE "Caregiver"
SET "householdId" = (
  SELECT "householdId"
  FROM "Child"
  WHERE "Child"."caregiverId" = "Caregiver"."id"
    AND "Child"."householdId" IS NOT NULL
  ORDER BY "Child"."createdAt" ASC
  LIMIT 1
)
WHERE "householdId" IS NULL
  AND EXISTS (
    SELECT 1 FROM "Child"
    WHERE "Child"."caregiverId" = "Caregiver"."id"
      AND "Child"."householdId" IS NOT NULL
  );
