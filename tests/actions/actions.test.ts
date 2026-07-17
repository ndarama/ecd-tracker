import { describe, it, expect, vi, beforeEach } from "vitest";
import { createChild, updateChild, deleteChild } from "@/actions/children";
import { createGrowthRecord, createImmunization, markImmunizationGiven, createMilestone } from "@/actions/health";
import { createVisit, updateVisitStatus, createReferral, updateReferralStatus } from "@/actions/visits";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    child: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    growthRecord: {
      create: vi.fn(),
    },
    immunization: {
      create: vi.fn(),
      update: vi.fn(),
    },
    milestone: {
      create: vi.fn(),
    },
    homeVisit: {
      create: vi.fn(),
      update: vi.fn(),
    },
    referral: {
      create: vi.fn(),
      update: vi.fn(),
    },
    user: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("Server Actions - Children", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createChild throws when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as any);
    const fd = new FormData();
    await expect(createChild(fd)).rejects.toThrow("Unauthorised");
  });

  it("createChild creates child and triggers redirect", async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "chw-1" } } as any);
    const fd = new FormData();
    fd.append("firstName", "Kudzi");
    fd.append("lastName", "Ndoro");
    fd.append("dateOfBirth", "2023-04-10");
    fd.append("gender", "FEMALE");
    fd.append("village", "Mabvuku");
    fd.append("caregiverName", "Sarah Ndoro");

    await createChild(fd);

    expect(prisma.child.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          firstName: "Kudzi",
          lastName: "Ndoro",
          chwId: "chw-1",
        }),
      })
    );
    expect(revalidatePath).toHaveBeenCalledWith("/children");
    expect(redirect).toHaveBeenCalledWith("/children");
  });

  it("deleteChild deletes and redirects", async () => {
    await deleteChild("c-100");
    expect(prisma.child.delete).toHaveBeenCalledWith({ where: { id: "c-100" } });
    expect(redirect).toHaveBeenCalledWith("/children");
  });
});

describe("Server Actions - Health & Milestones", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createGrowthRecord parses fields and redirects to growth tab", async () => {
    const fd = new FormData();
    fd.append("childId", "c-100");
    fd.append("date", "2026-07-17");
    fd.append("weightKg", "10.2");
    fd.append("heightCm", "78");
    fd.append("muacCm", "13.0");
    fd.append("nutritionStatus", "NORMAL");

    await createGrowthRecord(fd);

    expect(prisma.growthRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          childId: "c-100",
          weightKg: 10.2,
          heightCm: 78,
          muacCm: 13.0,
          nutritionStatus: "NORMAL",
        }),
      })
    );
    expect(redirect).toHaveBeenCalledWith("/children/c-100?tab=growth");
  });

  it("markImmunizationGiven updates givenDate and revalidates child view", async () => {
    await markImmunizationGiven("imm-1", "c-100");
    expect(prisma.immunization.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "imm-1" },
        data: expect.objectContaining({
          givenDate: expect.any(Date),
        }),
      })
    );
    expect(revalidatePath).toHaveBeenCalledWith("/children/c-100");
  });
});

describe("Server Actions - Home Visits & Referrals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createVisit creates visit record for logged in CHW", async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "chw-2" } } as any);
    const fd = new FormData();
    fd.append("childId", "c-1");
    fd.append("visitDate", "2026-07-17");
    fd.append("observations", "Routine checkup");
    fd.append("status", "SCHEDULED");

    await createVisit(fd);

    expect(prisma.homeVisit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          childId: "c-1",
          chwId: "chw-2",
          observations: "Routine checkup",
        }),
      })
    );
    expect(redirect).toHaveBeenCalledWith("/visits");
  });

  it("updateVisitStatus updates status and revalidates", async () => {
    vi.mocked(prisma.homeVisit.update).mockResolvedValueOnce({
      id: "v-1",
      childId: "c-1",
      status: "COMPLETED",
    } as any);

    await updateVisitStatus("v-1", "COMPLETED");

    expect(prisma.homeVisit.update).toHaveBeenCalledWith({
      where: { id: "v-1" },
      data: { status: "COMPLETED" },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/visits");
    expect(revalidatePath).toHaveBeenCalledWith("/children/c-1");
  });
});
