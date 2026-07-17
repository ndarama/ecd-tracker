import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH, DELETE } from "@/app/api/children/[id]/route";
import { createMockRequest, createMockSession } from "../helpers/test-utils";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    child: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("GET /api/children/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 404 if child is not found", async () => {
    const session = createMockSession("ADMIN", "admin-1");
    vi.mocked(auth).mockResolvedValueOnce(session as any);
    vi.mocked(prisma.child.findUnique).mockResolvedValueOnce(null);

    const req = createMockRequest("http://localhost:3000/api/children/child-missing");
    const res = await GET(req, { params: Promise.resolve({ id: "child-missing" }) });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error).toBe("Child not found");
  });

  it("should return 403 if CHW tries to access child belonging to another CHW", async () => {
    const session = createMockSession("CHW", "chw-101");
    vi.mocked(auth).mockResolvedValueOnce(session as any);
    vi.mocked(prisma.child.findUnique).mockResolvedValueOnce({
      id: "child-2",
      firstName: "Tendai",
      chwId: "chw-202", // different CHW
    } as any);

    const req = createMockRequest("http://localhost:3000/api/children/child-2");
    const res = await GET(req, { params: Promise.resolve({ id: "child-2" }) });
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toContain("Forbidden");
  });

  it("should return full child detail including health relations for authorized user", async () => {
    const session = createMockSession("CHW", "chw-101");
    vi.mocked(auth).mockResolvedValueOnce(session as any);

    const mockChildDetail = {
      id: "child-1",
      firstName: "Tendai",
      lastName: "Moyo",
      chwId: "chw-101",
      growthRecords: [{ id: "gr-1", weightKg: 12.5 }],
      immunizations: [{ id: "im-1", vaccine: "BCG" }],
      milestones: [{ id: "ms-1", description: "First steps" }],
      visits: [{ id: "vs-1", status: "COMPLETED" }],
      referrals: [],
    };

    vi.mocked(prisma.child.findUnique).mockResolvedValueOnce(mockChildDetail as any);

    const req = createMockRequest("http://localhost:3000/api/children/child-1");
    const res = await GET(req, { params: Promise.resolve({ id: "child-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.firstName).toBe("Tendai");
    expect(json.data.growthRecords).toHaveLength(1);
    expect(json.data.immunizations).toHaveLength(1);
  });
});

describe("PATCH /api/children/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update child details successfully", async () => {
    const session = createMockSession("CHW", "chw-101");
    vi.mocked(auth).mockResolvedValueOnce(session as any);

    vi.mocked(prisma.child.findUnique).mockResolvedValueOnce({
      id: "child-1",
      chwId: "chw-101",
    } as any);

    vi.mocked(prisma.child.update).mockResolvedValueOnce({
      id: "child-1",
      firstName: "Tendai Updated",
      village: "New Village",
    } as any);

    const req = createMockRequest("http://localhost:3000/api/children/child-1", {
      method: "PATCH",
      body: { firstName: "Tendai Updated", village: "New Village" },
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "child-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.firstName).toBe("Tendai Updated");
  });
});

describe("DELETE /api/children/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete child and return confirmation", async () => {
    const session = createMockSession("ADMIN", "admin-1");
    vi.mocked(auth).mockResolvedValueOnce(session as any);

    vi.mocked(prisma.child.findUnique).mockResolvedValueOnce({
      id: "child-1",
      chwId: "chw-101",
    } as any);
    vi.mocked(prisma.child.delete).mockResolvedValueOnce({ id: "child-1" } as any);

    const req = createMockRequest("http://localhost:3000/api/children/child-1", {
      method: "DELETE",
    });

    const res = await DELETE(req, { params: Promise.resolve({ id: "child-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.message).toContain("deleted successfully");
  });
});
