import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { seedDefaultMilestones } from "@/lib/milestone-checker";
import { ensureEssentialTrackers } from "@/lib/tracker-config";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        preferredUnit: "METRIC",
      },
    });

    // Seed initial milestone templates
    await seedDefaultMilestones(user.id);

    // Ensure the 4 official categories & essential trackers (Calories, Protein, Carbs, Fat, Weight, Height, BMI)
    await ensureEssentialTrackers(user.id, user.preferredUnit);

    // Seed starter training & habit trackers
    const starterTrackers = [
      {
        userId: user.id,
        name: "Morning Hydration",
        category: "Habits",
        type: "COUNTER",
        unit: "glasses",
        targetValue: 8,
        color: "#06b6d4",
        icon: "Droplets",
        sortOrder: 8,
      },
      {
        userId: user.id,
        name: "Daily Workout",
        category: "Training",
        type: "HABIT",
        unit: "session",
        targetValue: 1,
        color: "#10b981",
        icon: "Dumbbell",
        sortOrder: 9,
      },
      {
        userId: user.id,
        name: "Push-ups",
        category: "Training",
        type: "COUNTER",
        unit: "reps",
        targetValue: 50,
        color: "#f97316",
        icon: "Flame",
        sortOrder: 10,
      },
    ];

    for (const t of starterTrackers) {
      await prisma.tracker.create({ data: t });
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      preferredUnit: user.preferredUnit,
    });

    const response = NextResponse.json({
      message: "Account created successfully",
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
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create account" },
      { status: 500 }
    );
  }
}

