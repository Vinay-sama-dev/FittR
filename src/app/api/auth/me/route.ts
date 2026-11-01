import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, comparePassword, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getUserFromRequest(req);
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        preferredUnit: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 404 });
    }

    // Fetch user lifetime stats
    const totalLogs = await prisma.trackerLog.count({
      where: { userId: session.userId },
    });

    const activeTrackers = await prisma.tracker.count({
      where: { userId: session.userId, isArchived: false },
    });

    const unlockedMilestones = await prisma.milestone.count({
      where: { userId: session.userId, isAchieved: true },
    });

    const totalMilestones = await prisma.milestone.count({
      where: { userId: session.userId },
    });

    // Average efficiency score across recorded days
    const efficiencyRecords = await prisma.efficiencyRecord.findMany({
      where: { userId: session.userId },
      select: { score: true },
    });

    const avgEfficiency =
      efficiencyRecords.length > 0
        ? Math.round(
            (efficiencyRecords.reduce((acc, r) => acc + r.score, 0) /
              efficiencyRecords.length) *
              10
          ) / 10
        : 100;

    return NextResponse.json({
      user,
      stats: {
        totalLogs,
        activeTrackers,
        unlockedMilestones,
        totalMilestones,
        avgEfficiency,
        daysTracked: efficiencyRecords.length,
      },
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getUserFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, preferredUnit, currentPassword, newPassword } = body;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // P0: Sandboxed Demo Account Protection - cannot tamper with account credentials
    if (session.isDemo || user.email === "demo-sandbox@fittr.internal") {
      if (newPassword) {
        return NextResponse.json(
          { error: "Security restriction: Passwords cannot be modified in the shared demo environment." },
          { status: 403 }
        );
      }
    }

    const updateData: {
      name?: string;
      preferredUnit?: string;
      password?: string;
    } = {};

    if (name && name.trim()) {
      updateData.name = name.trim();
    }

    if (preferredUnit && (preferredUnit === "METRIC" || preferredUnit === "IMPERIAL")) {
      updateData.preferredUnit = preferredUnit;
    }

    // Handle password change if requested
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to set a new password" },
          { status: 400 }
        );
      }

      const isMatch = await comparePassword(currentPassword, user.password);
      if (!isMatch) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters" },
          { status: 400 }
        );
      }

      updateData.password = await hashPassword(newPassword);
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        preferredUnit: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
