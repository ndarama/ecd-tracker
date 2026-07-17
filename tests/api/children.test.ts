import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/children/route";
import { createMockRequest, createMockSession } from "../helpers/test-utils";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    child: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("GET /api/children", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when user is unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as any);

    const req = createMockRequest("http://localhost:3000/api/children");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error).toBe("Unauthorized access");
  });

  it("should return paginated children filtered by CHW for CHW role", async () => {
    const mockSession = createMockSession("CHW", "chw-101");
    vi.mocked(auth).mockResolvedValueOnce(mockSession as any);

    const mockChildren = [
      {
        id: "child-1",
        firstName: "Amina",
        lastName: "Moyo",
        gender: "FEMALE",
        village: "Ruwa",
        chwId: "chw-101",
        chw: { id: "chw-101", name: "Worker 1" },
        growthRecords: [],
        immunizations: [],
      },
    ];

    vi.mocked(prisma.child.findMany).mockResolvedValueOnce(mockChildren as any);
    vi.mocked(prisma.child.count).mockResolvedValueOnce(1);

    const req = createMockRequest("http://localhost:3000/api/children?page=1&limit=10");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.children).toHaveLength(1);
    expect(json.data.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });

    expect(prisma.child.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ chwId: "chw-101" }),
        skip: 0,
        take: 10,
      })
    );
  });

  it("should allow SUPERVISOR to view children across all CHWs with search", async () => {
    const mockSession = createMockSession("SUPERVISOR", "sup-1");
    vi.mocked(auth).mockResolvedValueOnce(mockSession as any);

    vi.mocked(prisma.child.findMany).mockResolvedValueOnce([] as any);
    vi.mocked(prisma.child.count).mockResolvedValueOnce(0);

    const req = createMockRequest("http://localhost:3000/api/children?search=John&village=Ruwa&gender=MALE");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(prisma.child.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          village: { contains: "Ruwa" },
          gender: "MALE",
          OR: expect.arrayContaining([
            { firstName: { contains: "John" } },
            { lastName: { contains: "John" } },
            { caregiverName: { contains: "John" } },
          ]),
        }),
      })
    );
  });
});

describe("POST /api/children", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 if required fields are missing", async () => {
    const mockSession = createMockSession("CHW", "chw-101");
    vi.mocked(auth).mockResolvedValueOnce(mockSession as any);

    const req = createMockRequest("http://localhost:3000/api/children", {
      method: "POST",
      body: { firstName: "Tinashe" }, // missing other required fields
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe("Missing required fields");
  });

  it("should return 400 if gender is invalid", async () => {
    const mockSession = createMockSession("CHW", "chw-101");
    vi.mocked(auth).mockResolvedValueOnce(mockSession as any);

    const req = createMockRequest("http://localhost:3000/api/children", {
      method: "POST",
      body: {
        firstName: "Tinashe",
        lastName: "Mutasa",
        dateOfBirth: "2024-05-12",
        gender: "UNKNOWN",
        village: "Goromonzi",
        caregiverName: "Grace Mutasa",
      },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("Invalid gender");
  });

  it("should successfully register a child and assign to current CHW", async () => {
    const mockSession = createMockSession("CHW", "chw-101");
    vi.mocked(auth).mockResolvedValueOnce(mockSession as any);

    const createdChild = {
      id: "child-99",
      firstName: "Farai",
      lastName: "Gumbo",
      dateOfBirth: new Date("2024-01-15"),
      gender: "MALE",
      village: "Domboshava",
      caregiverName: "Mary Gumbo",
      caregiverPhone: "+263771234567",
      chwId: "chw-101",
    };

    vi.mocked(prisma.child.create).mockResolvedValueOnce(createdChild as any);

    const req = createMockRequest("http://localhost:3000/api/children", {
      method: "POST",
      body: {
        firstName: "Farai",
        lastName: "Gumbo",
        dateOfBirth: "2024-01-15",
        gender: "MALE",
        village: "Domboshava",
        caregiverName: "Mary Gumbo",
        caregiverPhone: "+263771234567",
      },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.id).toBe("child-99");
    expect(prisma.child.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          firstName: "Farai",
          lastName: "Gumbo",
          gender: "MALE",
          chwId: "chw-101",
        }),
      })
    );
  });
});
