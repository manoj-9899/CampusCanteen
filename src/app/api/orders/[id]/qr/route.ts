import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildQrPayload } from "@/lib/tokens";
import { handleAuthError, jsonError } from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return jsonError("Order not found.", 404);
    }
    if (session.role === "STUDENT" && order.userId !== session.id) {
      return jsonError("Forbidden.", 403);
    }
    if (order.paymentStatus !== "PAID") {
      return jsonError("QR available only after payment.", 400);
    }

    const payload = buildQrPayload(order.id, order.tokenNumber, order.orderCode);
    const dataUrl = await QRCode.toDataURL(payload, {
      width: 280,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" },
    });

    return NextResponse.json({ qrDataUrl: dataUrl, payload });
  } catch (error) {
    return handleAuthError(error);
  }
}
