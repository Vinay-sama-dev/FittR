import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, hashPassword, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { formatDate } from "@/lib/utils";
import { subDays } from "date-fns";

export const dynamic = "force-dynamic";

// Sandboxed Demo Account Constant Identifier
const DEMO_EMAIL = "demo-sandbox@fittr.internal";
const DEMO_NAME = "Demo Athlete";

export async function POST(req: NextRequest) {
  try {
    // 1. Strict Rate Limiting (P1): max 5 demo launches per minute per IP
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "anonymous-client";

    const { success, remaining, resetMs } = rateLimit(`demo_auth:${clientIp}`, 5, 60000);

    if (!success) {
      return NextResponse.json(
        {
          error: "Too many demo access attempts. Please wait a minute before trying again.",
          retryAfterSeconds: Math.ceil(resetMs / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(resetMs / 1000)),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // 2. Find or Provision Isolated Demo Sandbox User (P0)
    let demoUser = await prisma.user.findUnique({
      where: { email: DEMO_EMAIL },
    });

    if (!demoUser) {
      // Auto-generate random secure hash so demo account cannot be accessed via standard password login
      const randomSecret = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const secureDemoPassword = await hashPassword(randomSecret);

      demoUser = await prisma.user.create({
        data: {
          name: DEMO_NAME,
          email: DEMO_EMAIL,
          password: secureDemoPassword,
          preferredUnit: "METRIC",
        },
      });

      // Seed realistic demo trackers
      const waterTracker = await prisma.tracker.create({
        data: {
          userId: demoUser.id,
          name: "Daily Hydration",
          category: "Nutrition",
          type: "COUNTER",
          unit: "glasses",
          targetValue: 8,
          color: "#06b6d4",
          icon: "Droplets",
          sortOrder: 1,
        },
      });

      const workoutTracker = await prisma.tracker.create({
        data: {
          userId: demoUser.id,
          name: "Morning Workout",
          category: "Workout",
          type: "HABIT",
          unit: "session",
          targetValue: 1,
          color: "#10b981",
          icon: "Dumbbell",
          sortOrder: 2,
        },
      });

      const pushupTracker = await prisma.tracker.create({
        data: {
          userId: demoUser.id,
          name: "Daily Push-ups",
          category: "Workout",
          type: "COUNTER",
          unit: "reps",
          targetValue: 50,
          color: "#f97316",
          icon: "Flame",
          sortOrder: 3,
        },
      });

      const weightTracker = await prisma.tracker.create({
        data: {
          userId: demoUser.id,
          name: "Body Weight",
          category: "Body",
          type: "NUMERIC",
          unit: "kg",
          targetValue: 74.0,
          color: "#8b5cf6",
          icon: "Scale",
          sortOrder: 4,
        },
      });

      // Seed 7 days of realistic history so graphs look great immediately
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const dStr = formatDate(subDays(today, i));
        // Hydration logs
        await prisma.trackerLog.create({
          data: {
            userId: demoUser.id,
            trackerId: waterTracker.id,
            date: dStr,
            value: 6 + Math.floor(Math.random() * 3),
          },
        });
        // Pushups logs
        await prisma.trackerLog.create({
          data: {
            userId: demoUser.id,
            trackerId: pushupTracker.id,
            date: dStr,
            value: 40 + Math.floor(Math.random() * 20),
          },
        });
        // Habit logs (completed on most days)
        if (i !== 3) {
          await prisma.trackerLog.create({
            data: {
              userId: demoUser.id,
              trackerId: workoutTracker.id,
              date: dStr,
              value: 1,
            },
          });
        }
      }

      // Weight log
      await prisma.trackerLog.create({
        data: {
          userId: demoUser.id,
          trackerId: weightTracker.id,
          date: formatDate(today),
          value: 74.5,
          notes: "Consistent morning check-in",
        },
      });

      // Seed Demo Milestones
      await prisma.milestone.create({
        data: {
          userId: demoUser.id,
          title: "First Step",
          description: "Logged your first activity in FittR",
          targetValue: 1,
          currentValue: 1,
          isAchieved: true,
          achievedAt: new Date(),
          icon: "Footprints",
          category: "TOTAL_VOLUME",
        },
      });

      await prisma.milestone.create({
        data: {
          userId: demoUser.id,
          title: "7-Day Streak Starter",
          description: "Maintain a 7-day fitness streak",
          targetValue: 7,
          currentValue: 6,
          isAchieved: false,
          icon: "Flame",
          category: "STREAK",
        },
      });
    }

    // 3. Issue Encrypted Short-Lived Demo Session Token (Expires in 2 hours for strict sandbox security)
    const token = await createSessionToken({
      userId: demoUser.id,
      email: demoUser.email,
      name: demoUser.name,
      preferredUnit: demoUser.preferredUnit,
      isDemo: true,
    });

    const response = NextResponse.json({
      message: "Demo session initiated",
      isDemo: true,
      expiresIn: "2 hours",
      user: {
        id: demoUser.id,
        name: demoUser.name,
        email: demoUser.email,
      },
    });

    // 2-hour cookie expiration for demo sessions
    response.cookies.set(SESSION_COOKIE_OPTIONS.name, token, {
      ...SESSION_COOKIE_OPTIONS.options,
      maxAge: 2 * 60 * 60, // 2 hours
    });

    response.headers.set("X-RateLimit-Remaining", String(remaining));

    return response;
  } catch (error) {
    console.error("Demo authentication error:", error);
    return NextResponse.json(
      { error: "Failed to initialize demo session" },
      { status: 500 }
    );
  }
}

