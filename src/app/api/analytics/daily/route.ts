import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getDailyAnalytics } from "@/lib/daily-analytics";
import { handleAuthError } from "@/lib/api-utils";

export async function GET() {
  try {
    await requireSession(["STAFF"]);
    const analytics = await getDailyAnalytics();
    return NextResponse.json({ analytics });
  } catch (error) {
    return handleAuthError(error);
  }
}
