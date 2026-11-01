import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, createSessionToken, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import {
  rateLimit,
  checkAccountLockout,
  recordFailedAttempt,
  clearFailedAttempts,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "login-client";

    // 1. IP-level rate limit: max 10 attempts per minute per IP
    const { success } = rateLimit(`login_ip:${clientIp}`, 10, 60000);
    if (!success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait 60 seconds before trying again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Check if account or IP is temporarily locked out
    const emailLockout = checkAccountLockout(`user:${normalizedEmail}`);
    if (emailLockout.isLocked) {
      return NextResponse.json(
        {
          error: `Account temporarily locked due to repeated failed logins. Please try again in ${emailLockout.remainingMinutes} minute(s) or reset your password.`,
        },
        { status: 423 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      recordFailedAttempt(`user:${normalizedEmail}`);
      recordFailedAttempt(`ip:${clientIp}`);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      const lockoutStatus = recordFailedAttempt(`user:${normalizedEmail}`);
      recordFailedAttempt(`ip:${clientIp}`);

      if (lockoutStatus.isLocked) {
        return NextResponse.json(
          {
            error: `Too many failed attempts. Account locked for ${lockoutStatus.remainingMinutes} minutes to protect your data.`,
          },
          { status: 423 }
        );
      }

      return NextResponse.json(
        {
          error: `Invalid email or password. ${lockoutStatus.attemptsLeft} attempt(s) remaining before temporary lockout.`,
        },
        { status: 401 }
      );
    }

    // Login successful: reset lockout counters
    clearFailedAttempts(`user:${normalizedEmail}`);
    clearFailedAttempts(`ip:${clientIp}`);

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      preferredUnit: user.preferredUnit,
    });

    const response = NextResponse.json({
      message: "Logged in successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        preferredUnit: user.preferredUnit,
      },
    });

    response.cookies.set(
      SESSION_COOKIE_OPTIONS.name,
      token,
      SESSION_COOKIE_OPTIONS.options
    );

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
