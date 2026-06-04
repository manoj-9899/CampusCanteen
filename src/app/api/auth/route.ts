import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createSession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleAuthError, jsonError } from "@/lib/api-utils";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  studentId: z.string().optional(),
  role: z.enum(["STUDENT", "STAFF"]).default("STUDENT"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action as string;

    if (action === "register") {
      const data = registerSchema.parse(body);
      const existing = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existing) {
        return jsonError("An account with this email already exists.");
      }

      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: await hashPassword(data.password),
          studentId: data.studentId,
          role: data.role,
        },
      });

      await createSession({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        studentId: user.studentId,
      });

      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }

    if (action === "login") {
      const data = loginSchema.parse(body);
      const user = await prisma.user.findUnique({ where: { email: data.email } });
      if (!user || !(await verifyPassword(data.password, user.password))) {
        return jsonError("Invalid email or password.", 401);
      }

      await createSession({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        studentId: user.studentId,
      });

      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }

    return jsonError("Invalid action.");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Invalid input.");
    }
    return handleAuthError(error);
  }
}
