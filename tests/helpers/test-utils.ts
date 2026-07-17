import { NextRequest } from "next/server";

export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
) {
  const { method = "GET", body, headers = {} } = options;

  const init: Record<string, any> = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

export function createMockSession(role: "CHW" | "SUPERVISOR" | "ADMIN" = "CHW", userId: string = "user-123") {
  return {
    user: {
      id: userId,
      name: "Test Community Health Worker",
      email: "test.chw@example.com",
      role,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}
