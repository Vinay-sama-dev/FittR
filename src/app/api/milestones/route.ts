import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkAndUpdateMilestones } from "@/lib/milestone-checker";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getUserFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Refresh milestones check
    await checkAndUpdateMilestones(session.userId);

    const milestones = await prisma.milestone.findMany({
      where: { userId: session.userId },
      include: { tracker: true },
      orderBy: [{ isAchieved: "desc" }, { createdAt: "desc" }],
    });

    const achieved = milestones.filter((m) => m.isAchieved);
    const inProgress = milestones.filter((m) => !m.isAchieved);

    return NextResponse.json({
      all: milestones,
      achieved,
      inProgress,
    });
  } catch (error) {
    console.error("Milestones fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch milestones" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getUserFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, targetValue, trackerId, icon, category } = body;

    if (!title || targetValue === undefined || targetValue === null) {
      return NextResponse.json(
        { error: "Title and target value are required" },
        { status: 400 }
      );
    }

    const milestone = await prisma.milestone.create({
      data: {
        userId: session.userId,
        title: title.trim(),
        description: description?.trim() || null,
        targetValue: parseFloat(targetValue),
        trackerId: trackerId || null,
        icon: icon || "Award",
        category: category || "CUSTOM",
      },
    });

    // Check if it's immediately achieved based on existing logs
    await checkAndUpdateMilestones(session.userId);

    return NextResponse.json({ milestone }, { status: 201 });
  } catch (error) {
    console.error("Create milestone error:", error);
    return NextResponse.json(
      { error: "Failed to create milestone" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getUserFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Milestone ID required" }, { status: 400 });
    }

    await prisma.milestone.deleteMany({
      where: { id, userId: session.userId },
    });

    return NextResponse.json({ message: "Milestone deleted" });
  } catch (error) {
    console.error("Delete milestone error:", error);
    return NextResponse.json(
      { error: "Failed to delete milestone" },
      { status: 500 }
    );
  }
}
