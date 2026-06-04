export interface QrOrderPayload {
  orderId: string;
  tokenNumber: string;
  orderCode: string;
}

export function parseQrPayload(raw: string): QrOrderPayload | null {
  try {
    const data = JSON.parse(raw) as Partial<QrOrderPayload>;
    if (data.orderId && data.tokenNumber && data.orderCode) {
      return {
        orderId: data.orderId,
        tokenNumber: data.tokenNumber.toUpperCase(),
        orderCode: data.orderCode.toUpperCase(),
      };
    }
  } catch {
    // Not JSON — may be plain token or order code
  }

  const trimmed = raw.trim().toUpperCase();
  if (trimmed.startsWith("ORD-")) {
    return { orderId: "", tokenNumber: "", orderCode: trimmed };
  }
  if (/^A\d+$/.test(trimmed)) {
    return { orderId: "", tokenNumber: trimmed, orderCode: "" };
  }

  return null;
}

export function verifyPayloadBody(payload: QrOrderPayload) {
  if (payload.orderId) return { orderId: payload.orderId };
  if (payload.tokenNumber) return { tokenNumber: payload.tokenNumber };
  return { orderCode: payload.orderCode };
}
