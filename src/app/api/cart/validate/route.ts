import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { validateCartStock } from "@/lib/inventory";
import { handleAuthError, jsonError } from "@/lib/api-utils";

const schema = z.object({
  items: z
    .array(
      z.object({
        menuItemId: z.string(),
        quantity: z.number().int().min(1).max(20),
      })
    )
    .min(1),
});

export async function POST(request: NextRequest) {
  try {
    await requireSession(["STUDENT"]);
    const { items } = schema.parse(await request.json());
    const result = await validateCartStock(items);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Invalid cart.");
    }
    return handleAuthError(error);
  }
}
