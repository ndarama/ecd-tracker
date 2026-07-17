import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getGrowth, POST as createGrowth } from "@/app/api/health/growth/route";
import { GET as getImmunizations, POST as createImmunization } from "@/app/api/health/immunizations/route";
import { determineNutritionStatus } from "@/lib/api-helpers";
import { createMockRequest, createMockSession } from "../helpers/test-utils";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    growthRecord: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    immunization: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    child: {
      findUnique: vi.fn(),
    },
  },
}));

describe("Nutrition Status Calculation Helper", () => {
  it("should categorize severe malnutrition when MUAC < 11.5cm", () => {
    expect(determineNutritionStatus(11.2, 8.0, 75)).toBe("SEVERE_MALNUTRITION");
  });

  it("should categorize moderate malnutrition when MUAC is between 11.5 and 12.4cm", () => {
    expect(determineNutritionStatus(12.0, 9.5, 78)).toBe("MODERATE_MALNUTRITION");
  });

  it("should categorize normal when MUAC >= 12.5cm", () => {
    expect(determineNutritionStatus(13.5, 11.0, 80)).toBe("NORMAL");
  });

  it("should fall back to BMI estimation if MUAC is not provided", () => {
    expect(determineNutritionStatus(null, 7.0, 80)).toBe("SEVERE_MALNUTRITION");
    expect(determineNutritionStatus(null, 10.0, 80)).toBe("NORMAL");
  });
});

describe("Growth Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should require childId query param on GET", async () => {
    const session = createMockSession();
    vi.mocked(auth).mockResolvedValueOnce(session as any);

    const req = createMockRequest("http://localhost:3000/api/health/growth");
    const res = await getGrowth(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("childId query parameter is required");
  });

  it("should create growth record with auto-assessed nutrition status", async () => {
    const session = createMockSession();
    vi.mocked(auth).mockResolvedValueOnce(session as any);
    vi.mocked(prisma.child.findUnique).mockResolvedValueOnce({ id: "child-1" } as any);

    const createdRecord = {
      id: "gr-1",
      childId: "child-1",
      date: new Date("2026-07-17"),
      weightKg: 8.5,
      heightCm: 72,
      muacCm: 11.0,
      nutritionStatus: "SEVERE_MALNUTRITION",
    };
    vi.mocked(prisma.growthRecord.create).mockResolvedValueOnce(createdRecord as any);

    const req = createMockRequest("http://localhost:3000/api/health/growth", {
      method: "POST",
      body: {
        childId: "child-1",
        date: "2026-07-17",
        weightKg: 8.5,
        heightCm: 72,
        muacCm: 11.0,
      },
    });

    const res = await createGrowth(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(prisma.growthRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nutritionStatus: "SEVERE_MALNUTRITION",
        }),
      })
    );
  });
});

describe("Immunization Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create immunization schedule entry", async () => {
    const session = createMockSession();
    vi.mocked(auth).mockResolvedValueOnce(session as any);
    vi.mocked(prisma.child.findUnique).mockResolvedValueOnce({ id: "child-1" } as any);

    const mockImm = {
      id: "imm-1",
      childId: "child-1",
      vaccine: "Measles-Rubella 1",
      dueDate: new Date("2026-08-01"),
      batchNumber: "BATCH-902",
    };
    vi.mocked(prisma.immunization.create).mockResolvedValueOnce(mockImm as any);

    const req = createMockRequest("http://localhost:3000/api/health/immunizations", {
      method: "POST",
      body: {
        childId: "child-1",
        vaccine: "Measles-Rubella 1",
        dueDate: "2026-08-01",
        batchNumber: "BATCH-902",
      },
    });

    const res = await createImmunization(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.vaccine).toBe("Measles-Rubella 1");
  });
});
