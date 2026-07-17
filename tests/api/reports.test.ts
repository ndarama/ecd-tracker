import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getSummaryReport } from "@/app/api/reports/summary/route";
import { createMockRequest, createMockSession } from "../helpers/test-utils";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    child: {
      count: vi.fn(),
    },
    homeVisit: {
      count: vi.fn(),
    },
    immunization: {
      count: vi.fn(),
    },
    growthRecord: {
      groupBy: vi.fn(),
    },
  },
}));

describe("GET /api/reports/summary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate correct metrics, completion rates, and malnutrition breakdowns", async () => {
    const session = createMockSession("SUPERVISOR", "sup-1");
    vi.mocked(auth).mockResolvedValueOnce(session as any);

    // Mock counts
    vi.mocked(prisma.child.count).mockResolvedValueOnce(50);
    vi.mocked(prisma.homeVisit.count)
      .mockResolvedValueOnce(100) // total
      .mockResolvedValueOnce(80) // completed
      .mockResolvedValueOnce(20); // scheduled

    vi.mocked(prisma.immunization.count)
      .mockResolvedValueOnce(5) // overdue
      .mockResolvedValueOnce(45); // completed

    vi.mocked(prisma.growthRecord.groupBy).mockResolvedValueOnce([
      { nutritionStatus: "NORMAL", _count: { _all: 35 } },
      { nutritionStatus: "MODERATE_MALNUTRITION", _count: { _all: 10 } },
      { nutritionStatus: "SEVERE_MALNUTRITION", _count: { _all: 5 } },
    ] as any);

    const req = createMockRequest("http://localhost:3000/api/reports/summary");
    const res = await getSummaryReport(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.children.total).toBe(50);
    expect(json.data.visits.total).toBe(100);
    expect(json.data.visits.completed).toBe(80);
    expect(json.data.visits.completionRate).toBe(80.0);
    expect(json.data.immunizations.completed).toBe(45);
    expect(json.data.immunizations.overdue).toBe(5);
    expect(json.data.nutrition.NORMAL).toBe(35);
    expect(json.data.nutrition.MODERATE_MALNUTRITION).toBe(10);
    expect(json.data.nutrition.SEVERE_MALNUTRITION).toBe(5);
    expect(json.data.nutrition.OVERWEIGHT).toBe(0);
  });
});
