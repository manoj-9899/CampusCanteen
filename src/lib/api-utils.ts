import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleAuthError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") {
      return jsonError("Please sign in to continue.", 401);
    }
    if (error.message === "SESSION_STALE") {
      return jsonError(
        "Your session expired after a database reset. Please log out and sign in again.",
        401
      );
    }
    if (error.message === "FORBIDDEN") {
      return jsonError("You do not have permission for this action.", 403);
    }
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  ) {
    return jsonError(
      "Your session or cart is out of date. Please log out, sign in again, and refresh the menu.",
      409
    );
  }

  console.error(error);
  return jsonError("Something went wrong. Please try again.", 500);
}
