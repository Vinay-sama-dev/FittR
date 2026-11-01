import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { calculateDayEfficiency } from "@/lib/efficiency";
import { subDays } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getUserFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const todayStr = dateParam || formatDate(new Date());

    // 1. Fetch all active trackers
    const trackers = await prisma.tracker.findMany({
      where: { userId: session.userId, isArchived: false },
      orderBy: { sortOrder: "asc" },
    });

    // 2. Fetch today's logs for this user
    const todayLogs = await prisma.trackerLog.findMany({
      where: { userId: session.userId, date: todayStr },
      include: { tracker: true },
    });

    // 3. Compute today's efficiency
    const todayEfficiency = calculateDayEfficiency(todayStr, trackers, todayLogs);

    // 4. Fetch the last 7 days efficiency for trend sparkline / bar chart
    const last7Days: Array<{ date: string; label: string; score: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dStr = formatDate(d);
      const label = d.toLocaleDateString("en-US", { weekday: "short" });

      const dayLogs = await prisma.trackerLog.findMany({
        where: { userId: session.userId, date: dStr },
      });
      const dayEff = calculateDayEfficiency(dStr, trackers, dayLogs);

      last7Days.push({
        date: dStr,
        label,
        score: dayEff.score,
      });
    }

    // 5. Calculate streak (consecutive days with at least 1 log or efficiency >= 50%)
    let currentStreak = 0;
    let checkDate = new Date();
    // Check up to 365 days back
    for (let i = 0; i < 365; i++) {
      const dStr = formatDate(checkDate);
      const logCount = await prisma.trackerLog.count({
        where: { userId: session.userId, date: dStr },
      });

      if (logCount > 0) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      } else {
        // If today has no log yet, don't break the streak if yesterday had logs
        if (i === 0) {
          checkDate = subDays(checkDate, 1);
          continue;
        }
        break;
      }
    }

    // 6. Recent achieved milestones & top pending milestones
    const recentMilestones = await prisma.milestone.findMany({
      where: { userId: session.userId, isAchieved: true },
      orderBy: { achievedAt: "desc" },
      take: 3,
    });

    const pendingMilestones = await prisma.milestone.findMany({
      where: { userId: session.userId, isAchieved: false },
      orderBy: { createdAt: "asc" },
      take: 3,
    });

    // 7. Map trackers with today's logged state
    const trackerLogMap = new Map<string, (typeof todayLogs)[0]>();
    todayLogs.forEach((l) => trackerLogMap.set(l.trackerId, l));

    const trackersWithToday = trackers.map((t) => {
      const log = trackerLogMap.get(t.id);
      return {
        ...t,
        todayLog: log
          ? {
              id: log.id,
              value: log.value,
              notes: log.notes,
              metadata: log.metadata ? JSON.parse(log.metadata) : null,
            }
          : null,
      };
    });

    return NextResponse.json({
      date: todayStr,
      efficiency: todayEfficiency,
      weeklyTrend: last7Days,
      streak: currentStreak,
      trackers: trackersWithToday,
      recentMilestones,
      pendingMilestones,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
