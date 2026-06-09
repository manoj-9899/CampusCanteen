/**
 * Development/test-only payment gateway simulation.
 * Ignored entirely when NODE_ENV === "production".
 *
 * Set TEST_PAYMENT_MODE to control outcomes without a real gateway:
 *   success (default) | failure | timeout | stock_changed
 *
 * See docs/PAYMENT_FLOW.md and docs/TESTING.md.
 */

export type PaymentSimOutcome = "success" | "failure" | "timeout" | "stock_changed";

export class PaymentSimulationTimeoutError extends Error {
  constructor() {
    super("PAYMENT_TIMEOUT");
    this.name = "PaymentSimulationTimeoutError";
  }
}

const VALID_MODES: PaymentSimOutcome[] = [
  "success",
  "failure",
  "timeout",
  "stock_changed",
];

export function isPaymentSimulationEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function resolvePaymentSimulationMode(): PaymentSimOutcome {
  if (!isPaymentSimulationEnabled()) return "success";

  const raw = (process.env.TEST_PAYMENT_MODE ?? "success").toLowerCase();
  if (VALID_MODES.includes(raw as PaymentSimOutcome)) {
    return raw as PaymentSimOutcome;
  }
  return "success";
}

function simulationDelayMs(): number {
  return process.env.NODE_ENV === "test" ? 25 : 500;
}

/**
 * Simulates an external payment gateway round-trip.
 * Returns the outcome mode; throws PaymentSimulationTimeoutError for timeout.
 */
export async function simulatePaymentGateway(): Promise<PaymentSimOutcome> {
  const mode = resolvePaymentSimulationMode();
  await new Promise((resolve) => setTimeout(resolve, simulationDelayMs()));

  if (mode === "timeout") {
    throw new PaymentSimulationTimeoutError();
  }
  return mode;
}
