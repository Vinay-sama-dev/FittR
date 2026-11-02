import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateDayEfficiency } from "@/lib/efficiency";
import { checkAndUpdateMilestones } from "@/lib/milestone-checker";
import { syncUserBMI } from "@/lib/tracker-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getUserFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const trackerId = searchParams.get("trackerId");

    const whereClause: Record<string, unknown> = { userId: session.userId };

    if (date) {
      whereClause.date = date;
    } else if (startDate && endDate) {
      whereClause.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    if (trackerId) {
      whereClause.trackerId = trackerId;
    }

    const logs = await prisma.trackerLog.findMany({
      where: whereClause,
      include: {
        tracker: true,
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getUserFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { trackerId, date, value, notes, metadata, mode } = body;

    if (!trackerId || !date || value === undefined) {
      return NextResponse.json(
        { error: "trackerId, date, and value are required" },
        { status: 400 }
      );
    }

    // Verify tracker ownership
    const tracker = await prisma.tracker.findFirst({
      where: { id: trackerId, userId: session.userId },
    });

    if (!tracker) {
      return NextResponse.json({ error: "Tracker not found" }, { status: 404 });
    }

    // Check if an existing log exists for this tracker on this date
    const existingLog = await prisma.trackerLog.findFirst({
      where: {
        userId: session.userId,
        trackerId,
        date,
      },
    });

    let finalValue = parseFloat(value);
    if (mode === "increment" && existingLog) {
      finalValue = existingLog.value + parseFloat(value);
    }
    if (tracker.type === "COUNTER") {
      finalValue = Math.max(0, finalValue);
    }

    let logRecord;
    if (existingLog) {
      logRecord = await prisma.trackerLog.update({
        where: { id: existingLog.id },
        data: {
          value: finalValue,
          notes: notes !== undefined ? notes : existingLog.notes,
          metadata: metadata !== undefined ? JSON.stringify(metadata) : existingLog.metadata,
        },
      });
    } else {
      logRecord = await prisma.trackerLog.create({
        data: {
          userId: session.userId,
          trackerId,
          date,
          value: finalValue,
          notes: notes || null,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });
    }

    // Automatically recalculate and store the daily efficiency score for this date
    const allActiveTrackers = await prisma.tracker.findMany({
      where: { userId: session.userId, isArchived: false },
    });

    const dayLogs = await prisma.trackerLog.findMany({
      where: { userId: session.userId, date },
    });

    const efficiency = calculateDayEfficiency(date, allActiveTrackers, dayLogs);

    await prisma.efficiencyRecord.upsert({
      where: {
        userId_date: {
          userId: session.userId,
          date,
        },
      },
      update: {
        score: efficiency.score,
        totalTrackers: efficiency.totalTrackers,
        completedTrackers: efficiency.completedTrackers,
      },
      create: {
        userId: session.userId,
        date,
        score: efficiency.score,
        totalTrackers: efficiency.totalTrackers,
        completedTrackers: efficiency.completedTrackers,
      },
    });

    // Auto-sync BMI if weight or height was updated
    if (tracker.systemCode === "WEIGHT" || tracker.systemCode === "HEIGHT") {
      await syncUserBMI(session.userId, date);
    }

    // Check milestones in background/inline
    await checkAndUpdateMilestones(session.userId);

    return NextResponse.json({
      log: logRecord,
      efficiency,
    });
  } catch (error) {
    console.error("Error creating/updating log:", error);
    return NextResponse.json(
      { error: "Failed to save log" },
      { status: 500 }
    );
  }
}
