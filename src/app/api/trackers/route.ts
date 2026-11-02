import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureEssentialTrackers, normalizeCategory } from "@/lib/tracker-config";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getUserFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure all 4 mandatory categories and essential cards are provisioned
    await ensureEssentialTrackers(session.userId, session.preferredUnit);

    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get("includeArchived") === "true";
    const categoryParam = searchParams.get("category");

    const trackers = await prisma.tracker.findMany({
      where: {
        userId: session.userId,
        ...(includeArchived ? {} : { isArchived: false }),
        ...(categoryParam ? { category: categoryParam } : {}),
      },
      orderBy: { sortOrder: "asc" },
      include: {
        logs: {
          orderBy: { date: "desc" },
          take: 7, // Last 7 logs for quick sparklines/trends
        },
      },
    });

    return NextResponse.json({ trackers });
  } catch (error) {
    console.error("Error fetching trackers:", error);
    return NextResponse.json(
      { error: "Failed to fetch trackers" },
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

    // Support batch reordering if array provided
    if (body.reorder && Array.isArray(body.reorder)) {
      for (const item of body.reorder) {
        if (item.id && typeof item.sortOrder === "number") {
          await prisma.tracker.updateMany({
            where: { id: item.id, userId: session.userId },
            data: { sortOrder: item.sortOrder },
          });
        }
      }
      return NextResponse.json({ success: true });
    }

    const { name, category, type, unit, targetValue, color, icon } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and tracker type are required" },
        { status: 400 }
      );
    }

    const canonicalCategory = normalizeCategory(category || "Habits");

    // Get current tracker count for sortOrder
    const count = await prisma.tracker.count({
      where: { userId: session.userId },
    });

    const tracker = await prisma.tracker.create({
      data: {
        userId: session.userId,
        name: name.trim(),
        category: canonicalCategory,
        type, // NUMERIC, HABIT, COUNTER, DURATION, WORKOUT
        unit: type === "HABIT" ? null : unit || null,
        targetValue: targetValue !== undefined && targetValue !== null && targetValue !== "" ? parseFloat(targetValue) : null,
        color: color || "#10b981",
        icon: icon || "Activity",
        isEssential: false,
        sortOrder: count + 1,
      },
    });

    return NextResponse.json({ tracker }, { status: 201 });
  } catch (error) {
    console.error("Error creating tracker:", error);
    return NextResponse.json(
      { error: "Failed to create tracker" },
      { status: 500 }
    );
  }
}
