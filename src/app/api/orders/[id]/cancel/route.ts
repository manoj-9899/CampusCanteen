import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import {
  cancelOrderByStudent,
  expireStalePendingOrders,
  lifecycleErrorMessage,
} from "@/lib/order-lifecycle";
import { stripPickupSecret } from "@/lib/order-response";
import { handleAuthError, jsonError } from "@/lib/api-utils";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(["STUDENT"]);
    const { id } = await params;

    await expireStalePendingOrders(session.id);

    const order = await cancelOrderByStudent(id, session.id);

    return NextResponse.json({
      success: true,
      message: "Order cancelled.",
      order: stripPickupSecret(order),
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return jsonError(lifecycleErrorMessage("NOT_FOUND"), 404);
      }
      if (error.message === "FORBIDDEN") {
        return jsonError(lifecycleErrorMessage("FORBIDDEN"), 403);
      }
      if (error.message === "CANNOT_CANCEL") {
        return jsonError(lifecycleErrorMessage("CANNOT_CANCEL"), 400);
      }
    }
    return handleAuthError(error);
  }
}
