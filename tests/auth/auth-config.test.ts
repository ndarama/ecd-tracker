import { describe, it, expect } from "vitest";
import { authConfig } from "@/lib/auth.config";

describe("NextAuth Configuration & Route Protection", () => {
  const authorizedCallback = authConfig.callbacks?.authorized;
  const jwtCallback = authConfig.callbacks?.jwt;
  const sessionCallback = authConfig.callbacks?.session;

  it("should allow unauthenticated access to /login", async () => {
    const nextUrl = new URL("http://localhost:3000/login");
    const result = await (authorizedCallback as any)({
      auth: null,
      request: { nextUrl },
    });
    expect(result).toBe(true);
  });

  it("should redirect logged-in user away from /login to /dashboard", async () => {
    const nextUrl = new URL("http://localhost:3000/login");
    const auth = { user: { id: "u-1", name: "CHW User", role: "CHW" } };
    const result = await (authorizedCallback as any)({
      auth,
      request: { nextUrl },
    });
    expect(result).toBeInstanceOf(Response);
  });

  it("should block unauthenticated access to protected routes like /children", async () => {
    const nextUrl = new URL("http://localhost:3000/children");
    const result = await (authorizedCallback as any)({
      auth: null,
      request: { nextUrl },
    });
    expect(result).toBe(false);
  });

  it("should pass role and ID through JWT token", async () => {
    const token = await (jwtCallback as any)({
      token: {},
      user: { id: "user-123", role: "SUPERVISOR" },
      account: null,
    });
    expect(token?.id).toBe("user-123");
    expect(token?.role).toBe("SUPERVISOR");
  });

  it("should populate session.user from JWT token", async () => {
    const sessionResult = await (sessionCallback as any)({
      session: { user: {}, expires: new Date().toISOString() },
      token: { id: "user-123", role: "ADMIN" },
      user: {},
      newSession: null,
      trigger: "update",
    });
    expect(sessionResult.user.id).toBe("user-123");
    expect(sessionResult.user.role).toBe("ADMIN");
  });
});
