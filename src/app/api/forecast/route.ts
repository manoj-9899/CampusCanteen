import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { generateDemandForecast } from "@/lib/forecast";
import { handleAuthError } from "@/lib/api-utils";

export async function GET() {
  try {
    await requireSession(["STAFF"]);
    const forecast = await generateDemandForecast();
    return NextResponse.json({ forecast });
  } catch (error) {
    return handleAuthError(error);
  }
}
