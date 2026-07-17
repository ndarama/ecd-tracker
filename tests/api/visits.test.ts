import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getVisits, POST as createVisit } from "@/app/api/visits/route";
import { GET as getVisit, PATCH as updateVisit } from "@/app/api/visits/[id]/route";
import { createMockRequest, createMockSession } from "../helpers/test-utils";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    homeVisit: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    child: {
      findUnique: vi.fn(),
    },
  },
}));

describe("GET /api/visits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should list visits for the authenticated CHW with pagination", async () => {
    const session = createMockSession("CHW", "chw-101");
    vi.mocked(auth).mockResolvedValueOnce(session as any);

    const mockVisits = [
      {
        id: "visit-1",
        childId: "child-1",
        chwId: "chw-101",
        visitDate: new Date(),
        status: "SCHEDULED",
        child: { id: "child-1", firstName: "Simba", lastName: "Shumba" },
      },
    ];

    vi.mocked(prisma.homeVisit.findMany).mockResolvedValueOnce(mockVisits as any);
    vi.mocked(prisma.homeVisit.count).mockResolvedValueOnce(1);

    const req = createMockRequest("http://localhost:3000/api/visits?status=SCHEDULED");
    const res = await getVisits(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.visits).toHaveLength(1);
    expect(prisma.homeVisit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          chwId: "chw-101",
          status: "SCHEDULED",
        }),
      })
    );
  });
});

describe("POST /api/visits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 when childId or visitDate is missing", async () => {
    const session = createMockSession("CHW", "chw-101");
    vi.mocked(auth).mockResolvedValueOnce(session as any);

    const req = createMockRequest("http://localhost:3000/api/visits", {
      method: "POST",
      body: { childId: "child-1" },
    });

    const res = await createVisit(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("required");
  });

  it("should return 404 when target child does not exist", async () => {
    const session = createMockSession("CHW", "chw-101");
    vi.mocked(auth).mockResolvedValueOnce(session as any);
    vi.mocked(prisma.child.findUnique).mockResolvedValueOnce(null);

    const req = createMockRequest("http://localhost:3000/api/visits", {
      method: "POST",
      body: { childId: "missing-child", visitDate: "2026-07-20" },
    });

    const res = await createVisit(req);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toContain("does not exist");
  });

  it("should create home visit successfully", async () => {
    const session = createMockSession("CHW", "chw-101");
    vi.mocked(auth).mockResolvedValueOnce(session as any);
    vi.mocked(prisma.child.findUnique).mockResolvedValueOnce({ id: "child-1" } as any);

    const createdVisit = {
      id: "visit-123",
      childId: "child-1",
      chwId: "chw-101",
      visitDate: new Date("2026-07-25"),
      observations: "Child is active and healthy",
      status: "SCHEDULED",
    };
    vi.mocked(prisma.homeVisit.create).mockResolvedValueOnce(createdVisit as any);

    const req = createMockRequest("http://localhost:3000/api/visits", {
      method: "POST",
      body: {
        childId: "child-1",
        visitDate: "2026-07-25",
        observations: "Child is active and healthy",
      },
    });

    const res = await createVisit(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.id).toBe("visit-123");
  });
});

describe("PATCH /api/visits/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update visit status and observations", async () => {
    const session = createMockSession("CHW", "chw-101");
    vi.mocked(auth).mockResolvedValueOnce(session as any);

    vi.mocked(prisma.homeVisit.findUnique).mockResolvedValueOnce({
      id: "visit-123",
      chwId: "chw-101",
    } as any);

    vi.mocked(prisma.homeVisit.update).mockResolvedValueOnce({
      id: "visit-123",
      status: "COMPLETED",
      observations: "Completed full checkup",
    } as any);

    const req = createMockRequest("http://localhost:3000/api/visits/visit-123", {
      method: "PATCH",
      body: { status: "COMPLETED", observations: "Completed full checkup" },
    });

    const res = await updateVisit(req, { params: Promise.resolve({ id: "visit-123" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.status).toBe("COMPLETED");
  });

  it("should reject invalid status values", async () => {
    const session = createMockSession("CHW", "chw-101");
    vi.mocked(auth).mockResolvedValueOnce(session as any);
    vi.mocked(prisma.homeVisit.findUnique).mockResolvedValueOnce({
      id: "visit-123",
      chwId: "chw-101",
    } as any);

    const req = createMockRequest("http://localhost:3000/api/visits/visit-123", {
      method: "PATCH",
      body: { status: "INVALID_STATUS" },
    });

    const res = await updateVisit(req, { params: Promise.resolve({ id: "visit-123" }) });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Invalid visit status");
  });
});
