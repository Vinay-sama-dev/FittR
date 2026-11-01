import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { seedDefaultMilestones } from "@/lib/milestone-checker";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, registrationCode } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Check optional registration code if configured
    const requiredCode = process.env.REGISTRATION_CODE;
    if (requiredCode && requiredCode.trim() !== "") {
      if (registrationCode !== requiredCode) {
        return NextResponse.json(
          { error: "Invalid registration code" },
          { status: 403 }
        );
      }
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

    // Seed default starter trackers so the user has an immediate, ready-to-use dashboard
    const defaultTrackers = [
      {
        userId: user.id,
        name: "Morning Hydration",
        category: "Habit",
        type: "COUNTER",
        unit: "glasses",
        targetValue: 8,
        color: "#06b6d4",
        icon: "Droplets",
        sortOrder: 1,
      },
      {
        userId: user.id,
        name: "Daily Workout",
        category: "Workout",
        type: "HABIT",
        unit: "session",
        targetValue: 1,
        color: "#10b981",
        icon: "Dumbbell",
        sortOrder: 2,
      },
      {
        userId: user.id,
        name: "Body Weight",
        category: "Body",
        type: "NUMERIC",
        unit: "kg",
        targetValue: 75,
        color: "#8b5cf6",
        icon: "Scale",
        sortOrder: 3,
      },
      {
        userId: user.id,
        name: "Push-ups",
        category: "Workout",
        type: "COUNTER",
        unit: "reps",
        targetValue: 50,
        color: "#f97316",
        icon: "Flame",
        sortOrder: 4,
      },
    ];

    for (const t of defaultTrackers) {
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
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}

