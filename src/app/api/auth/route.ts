import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createSession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { enforceRateLimit, handleAuthError, jsonError } from "@/lib/api-utils";
import {
  RATE_LIMITS,
  checkRateLimit,
  getClientIp,
  rateLimitKey,
} from "@/lib/rate-limit";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  studentId: z.string().optional(),
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
      const ip = getClientIp(request);
      const limited = enforceRateLimit(
        checkRateLimit(
          rateLimitKey("auth:register", ip),
          RATE_LIMITS.authRegister.limit,
          RATE_LIMITS.authRegister.windowMs
        )
      );
      if (limited) return limited;

      const data = registerSchema.parse(body);
      const studentId = data.studentId?.trim() || null;

      const existing = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existing) {
        return jsonError("An account with this email already exists.");
      }

      if (studentId) {
        const existingStudentId = await prisma.user.findUnique({
          where: { studentId },
        });
        if (existingStudentId) {
          return jsonError("This student ID is already registered.");
        }
      }

      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: await hashPassword(data.password),
          studentId,
          role: "STUDENT",
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
      const ip = getClientIp(request);
      const limited = enforceRateLimit(
        checkRateLimit(
          rateLimitKey("auth:login", ip),
          RATE_LIMITS.authLogin.limit,
          RATE_LIMITS.authLogin.windowMs
        )
      );
      if (limited) return limited;

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
