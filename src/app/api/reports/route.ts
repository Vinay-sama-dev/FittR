import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { calculateDayEfficiency } from "@/lib/efficiency";
import { subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getUserFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "weekly"; // weekly, monthly, quarterly, custom
    const customStart = searchParams.get("startDate");
    const customEnd = searchParams.get("endDate");
    const trackerFilter = searchParams.get("trackers"); // comma-separated tracker IDs
    const format = searchParams.get("format") || "json"; // json or csv

    const now = new Date();
    let startDateStr = "";
    let endDateStr = formatDate(now);
    let rangeLabel = "";

    if (range === "weekly") {
      startDateStr = formatDate(startOfWeek(now, { weekStartsOn: 1 }));
      endDateStr = formatDate(endOfWeek(now, { weekStartsOn: 1 }));
      rangeLabel = `Weekly Report (${startDateStr} to ${endDateStr})`;
    } else if (range === "monthly") {
      startDateStr = formatDate(startOfMonth(now));
      endDateStr = formatDate(endOfMonth(now));
      rangeLabel = `Monthly Report (${startDateStr} to ${endDateStr})`;
    } else if (range === "quarterly") {
      // Last 90 days or current quarter
      startDateStr = formatDate(subMonths(now, 3));
      endDateStr = formatDate(now);
      rangeLabel = `Quarterly Report (${startDateStr} to ${endDateStr})`;
    } else if (range === "custom") {
      startDateStr = customStart || formatDate(subDays(now, 7));
      endDateStr = customEnd || formatDate(now);
      rangeLabel = `Custom Report (${startDateStr} to ${endDateStr})`;
    } else {
      startDateStr = formatDate(subDays(now, 7));
      endDateStr = formatDate(now);
      rangeLabel = `Report (${startDateStr} to ${endDateStr})`;
    }

    // Parse tracker filter
    const selectedTrackerIds = trackerFilter
      ? trackerFilter.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    // Fetch trackers
    const trackerWhere: Record<string, unknown> = {
      userId: session.userId,
    };
    if (selectedTrackerIds.length > 0) {
      trackerWhere.id = { in: selectedTrackerIds };
    }

    const trackers = await prisma.tracker.findMany({
      where: trackerWhere,
      orderBy: { sortOrder: "asc" },
    });

    // Fetch logs in date range
    const logs = await prisma.trackerLog.findMany({
      where: {
        userId: session.userId,
        date: {
          gte: startDateStr,
          lte: endDateStr,
        },
        ...(selectedTrackerIds.length > 0 ? { trackerId: { in: selectedTrackerIds } } : {}),
      },
      include: { tracker: true },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });

    // Compute unique days logged
    const loggedDatesSet = new Set(logs.map((l) => l.date));
    const totalDaysLogged = loggedDatesSet.size;

    // Calculate daily efficiency across the period
    const dateMapLogs = new Map<string, typeof logs>();
    logs.forEach((log) => {
      const existing = dateMapLogs.get(log.date) || [];
      existing.push(log);
      dateMapLogs.set(log.date, existing);
    });

    let totalEfficiencySum = 0;
    const efficiencyHistory: Array<{ date: string; score: number }> = [];

    dateMapLogs.forEach((dayLogs, dateStr) => {
      const dayEff = calculateDayEfficiency(dateStr, trackers, dayLogs);
      totalEfficiencySum += dayEff.score;
      efficiencyHistory.push({ date: dateStr, score: dayEff.score });
    });

    const averageEfficiency =
      totalDaysLogged > 0
        ? Math.round((totalEfficiencySum / totalDaysLogged) * 10) / 10
        : 0;

    // Tracker-by-tracker summary calculations
    const trackerSummaries = trackers.map((t) => {
      const tLogs = logs.filter((l) => l.trackerId === t.id);
      const values = tLogs.map((l) => l.value);

      const count = values.length;
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;
      const max = count > 0 ? Math.max(...values) : 0;
      const min = count > 0 ? Math.min(...values) : 0;
      const startVal = count > 0 ? values[0] : null;
      const endVal = count > 0 ? values[values.length - 1] : null;
      const delta =
        startVal !== null && endVal !== null
          ? Math.round((endVal - startVal) * 10) / 10
          : 0;

      let targetMetDays = 0;
      if (t.targetValue && t.targetValue > 0) {
        targetMetDays = values.filter((v) => v >= (t.targetValue || 0)).length;
      } else if (t.type === "HABIT") {
        targetMetDays = values.filter((v) => v >= 1).length;
      }

      const completionRate =
        count > 0 ? Math.round((targetMetDays / count) * 100) : 0;

      return {
        id: t.id,
        name: t.name,
        category: t.category,
        type: t.type,
        unit: t.unit || "",
        targetValue: t.targetValue,
        totalLogged: count,
        firstValue: startVal,
        latestValue: endVal,
        delta,
        averageValue: avg,
        maxValue: max,
        minValue: min,
        targetMetDays,
        completionRate,
      };
    });

    // Fetch milestones achieved in this range
    const achievedMilestones = await prisma.milestone.findMany({
      where: {
        userId: session.userId,
        isAchieved: true,
        achievedAt: {
          gte: new Date(startDateStr + "T00:00:00.000Z"),
          lte: new Date(endDateStr + "T23:59:59.999Z"),
        },
      },
    });

    // Check if user requested CSV
    if (format === "csv") {
      let csv = `FittR Fitness Report\n`;
      csv += `Report Range,${rangeLabel}\n`;
      csv += `Start Date,${startDateStr}\n`;
      csv += `End Date,${endDateStr}\n`;
      csv += `Active Trackers,${trackers.length}\n`;
      csv += `Total Days Logged,${totalDaysLogged}\n`;
      csv += `Average Efficiency,${averageEfficiency}%\n\n`;

      csv += `Tracker Summaries\n`;
      csv += `Name,Category,Type,Unit,Target,Entries,Start Value,Latest Value,Net Change,Average,Max,Min,Target Met %,Completed Days\n`;
      trackerSummaries.forEach((ts) => {
        csv += `"${ts.name}","${ts.category}","${ts.type}","${ts.unit}",${ts.targetValue || "N/A"},${ts.totalLogged},${ts.firstValue ?? "N/A"},${ts.latestValue ?? "N/A"},${ts.delta},${ts.averageValue},${ts.maxValue},${ts.minValue},${ts.completionRate}%,${ts.targetMetDays}\n`;
      });

      csv += `\nDetailed Activity Logs\n`;
      csv += `Date,Tracker,Category,Value,Unit,Notes\n`;
      logs.forEach((l) => {
        const cleanNotes = (l.notes || "").replace(/"/g, '""');
        csv += `"${l.date}","${l.tracker.name}","${l.tracker.category}",${l.value},"${l.tracker.unit || ""}" ,"${cleanNotes}"\n`;
      });

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="fittr-${range}-report-${startDateStr}-to-${endDateStr}.csv"`,
        },
      });
    }

    return NextResponse.json({
      range,
      rangeLabel,
      startDate: startDateStr,
      endDate: endDateStr,
      totalDaysLogged,
      averageEfficiency,
      efficiencyHistory,
      trackerSummaries,
      achievedMilestones,
      logs,
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
