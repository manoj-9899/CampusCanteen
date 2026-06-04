import { NextResponse } from "next/server";
import { destroySession, getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, name: true, role: true, studentId: true },
  });

  if (!user) {
    await destroySession();
    return NextResponse.json({ user: null, stale: true });
  }

  return NextResponse.json({ user });
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ success: true });
}
