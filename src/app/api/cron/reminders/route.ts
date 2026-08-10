import { deliverPendingReminders } from "@/lib/reminders";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await deliverPendingReminders();
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
