import type { BreastfeedingStatus, NutritionStatus } from "@/generated/prisma/client";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const NUTRITION_STATUSES = new Set<NutritionStatus>([
  "NORMAL",
  "MODERATE_MALNUTRITION",
  "SEVERE_MALNUTRITION",
  "OVERWEIGHT",
]);
const BREASTFEEDING_STATUSES = new Set<BreastfeedingStatus>([
  "EXCLUSIVE",
  "PARTIAL",
  "NOT_BREASTFED",
  "NOT_APPLICABLE",
]);

function requiredText(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function requiredDate(formData: FormData, name: string) {
  const value = requiredText(formData, name);
  if (!DATE_PATTERN.test(value)) throw new Error(`${name} must be a valid date`);
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) throw new Error(`${name} must be a valid date`);
  return date;
}

function optionalNumber(formData: FormData, name: string, min: number, max: number) {
  const raw = String(formData.get(name) ?? "").trim();
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${name} must be between ${min} and ${max}`);
  }
  return value;
}

export function validateGrowthForm(formData: FormData) {
  const date = requiredDate(formData, "date");
  const weightKg = optionalNumber(formData, "weightKg", 0.1, 50);
  const heightCm = optionalNumber(formData, "heightCm", 20, 150);
  const muacCm = optionalNumber(formData, "muacCm", 5, 30);
  if (weightKg === null && heightCm === null && muacCm === null) {
    throw new Error("At least one growth measurement is required");
  }

  const rawStatus = String(formData.get("nutritionStatus") ?? "").trim();
  if (rawStatus && !NUTRITION_STATUSES.has(rawStatus as NutritionStatus)) {
    throw new Error("Invalid nutrition status");
  }

  return {
    date,
    weightKg,
    heightCm,
    muacCm,
    nutritionStatus: rawStatus ? rawStatus as NutritionStatus : null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
}

export function validateNutritionForm(formData: FormData) {
  const rawBreastfeeding = requiredText(formData, "breastfeedingStatus");
  if (!BREASTFEEDING_STATUSES.has(rawBreastfeeding as BreastfeedingStatus)) {
    throw new Error("Invalid breastfeeding status");
  }

  return {
    date: requiredDate(formData, "date"),
    mealDescription: requiredText(formData, "mealDescription"),
    feedingHabits: requiredText(formData, "feedingHabits"),
    breastfeedingStatus: rawBreastfeeding as BreastfeedingStatus,
    nutritionConcerns: String(formData.get("nutritionConcerns") ?? "").trim() || null,
    recommendedSupport: String(formData.get("recommendedSupport") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
}

export function validateImmunizationForm(formData: FormData) {
  const vaccine = requiredText(formData, "vaccine");
  const dueDate = requiredDate(formData, "dueDate");
  const rawGivenDate = String(formData.get("givenDate") ?? "").trim();
  const givenDate = rawGivenDate
    ? requiredDate(formData, "givenDate")
    : null;
  if (givenDate && givenDate < dueDate) {
    throw new Error("Date given cannot be before the due date");
  }

  return {
    vaccine,
    dueDate,
    givenDate,
    batchNumber: String(formData.get("batchNumber") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
}
