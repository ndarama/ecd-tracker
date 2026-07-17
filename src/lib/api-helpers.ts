import { NextResponse } from "next/server";
import { NutritionStatus } from "@/generated/prisma/client";

export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

export function errorResponse(
  message: string,
  status: number = 400,
  errors?: Record<string, string[]> | string[]
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(errors ? { errors } : {}),
    },
    { status }
  );
}

/**
 * Determine WHO/ECD nutrition status based on MUAC (cm) or weight/height if available.
 * MUAC guidelines for children 6-59 months:
 * - < 11.5 cm: Severe Malnutrition (SAM)
 * - 11.5 - 12.4 cm: Moderate Malnutrition (MAM)
 * - >= 12.5 cm: Normal
 */
export function determineNutritionStatus(
  muacCm?: number | null,
  weightKg?: number | null,
  heightCm?: number | null
): NutritionStatus {
  if (muacCm != null) {
    if (muacCm < 11.5) return "SEVERE_MALNUTRITION";
    if (muacCm < 12.5) return "MODERATE_MALNUTRITION";
    return "NORMAL";
  }

  // Fallback BMI/WHZ estimation if MUAC not provided
  if (weightKg != null && heightCm != null && heightCm > 0) {
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    if (bmi < 13) return "SEVERE_MALNUTRITION";
    if (bmi < 14.5) return "MODERATE_MALNUTRITION";
    if (bmi > 20) return "OVERWEIGHT";
    return "NORMAL";
  }

  return "NORMAL";
}
