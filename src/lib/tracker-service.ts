import { prisma } from "@/lib/prisma";
import {
  ESSENTIAL_TRACKERS,
  normalizeCategory,
  calculateBMI,
} from "@/lib/tracker-config";

/**
 * Automatically computes and synchronizes BMI log for a date if weight and height are known.
 * Safely guards against non-existent users and handles both Metric and Imperial units.
 */
export async function syncUserBMI(userId: string, date: string): Promise<number | null> {
  if (!userId) return null;

  // 1. Ensure user exists to avoid foreign key violations
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, preferredUnit: true },
  });
  if (!user) return null;

  const [weightTracker, heightTracker, bmiTracker] = await Promise.all([
    prisma.tracker.findFirst({ where: { userId, systemCode: "WEIGHT" } }),
    prisma.tracker.findFirst({ where: { userId, systemCode: "HEIGHT" } }),
    prisma.tracker.findFirst({ where: { userId, systemCode: "BMI" } }),
  ]);

  if (!bmiTracker) return null;

  // Find weight for this date, or fallback to latest weight log
  let weightLog = weightTracker
    ? await prisma.trackerLog.findFirst({
        where: { userId, trackerId: weightTracker.id, date },
      })
    : null;

  if (!weightLog && weightTracker) {
    weightLog = await prisma.trackerLog.findFirst({
      where: { userId, trackerId: weightTracker.id, date: { lte: date } },
      orderBy: { date: "desc" },
    });
  }

  // Find height for this date, or fallback to latest height log
  let heightLog = heightTracker
    ? await prisma.trackerLog.findFirst({
        where: { userId, trackerId: heightTracker.id, date },
      })
    : null;

  if (!heightLog && heightTracker) {
    heightLog = await prisma.trackerLog.findFirst({
      where: { userId, trackerId: heightTracker.id, date: { lte: date } },
      orderBy: { date: "desc" },
    });
  }

  const weightVal = weightLog?.value || weightTracker?.targetValue || 0;
  const heightVal = heightLog?.value || heightTracker?.targetValue || 0;

  if (weightVal > 0 && heightVal > 0) {
    const bmi = calculateBMI(
      weightVal,
      heightVal,
      weightTracker?.unit || (user.preferredUnit === "IMPERIAL" ? "lbs" : "kg"),
      heightTracker?.unit || (user.preferredUnit === "IMPERIAL" ? "in" : "cm")
    );

    if (bmi <= 0) return null;

    // Upsert BMI log for this date
    const existingBMILog = await prisma.trackerLog.findFirst({
      where: { userId, trackerId: bmiTracker.id, date },
    });

    if (existingBMILog) {
      await prisma.trackerLog.update({
        where: { id: existingBMILog.id },
        data: { value: bmi },
      });
    } else {
      await prisma.trackerLog.create({
        data: {
          userId,
          trackerId: bmiTracker.id,
          date,
          value: bmi,
          notes: `Auto-computed from weight & height`,
        },
      });
    }
    return bmi;
  }

  return null;
}

/**
 * Ensures a user has all essential mandatory trackers provisioned.
 * Idempotent, safe to call repeatedly. Preserves all user logs.
 * Validates that the user exists in DB before attempting creation.
 */
export async function ensureEssentialTrackers(
  userId: string,
  preferredUnit = "METRIC"
): Promise<void> {
  if (!userId) return;

  // Verify user exists in database to prevent P2003 foreign key constraint errors
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, preferredUnit: true },
  });
  if (!user) return;

  const unitPreference = user.preferredUnit || preferredUnit;
  const weightUnit = unitPreference === "IMPERIAL" ? "lbs" : "kg";
  const heightUnit = unitPreference === "IMPERIAL" ? "in" : "cm";

  const existing = await prisma.tracker.findMany({
    where: { userId },
  });

  let currentOrder = existing.length;

  // Check for existing trackers that might match essential ones by name or systemCode
  for (const template of ESSENTIAL_TRACKERS) {
    const found = existing.find(
      (t) =>
        t.systemCode === template.systemCode ||
        t.name.toLowerCase() === template.name.toLowerCase() ||
        (template.systemCode === "WEIGHT" && t.name.toLowerCase() === "body weight") ||
        (template.systemCode === "BMI" && t.name.toLowerCase().includes("bmi"))
    );

    if (found) {
      // Update with systemCode and isEssential if not set
      if (!found.isEssential || !found.systemCode || found.category !== template.category) {
        await prisma.tracker.update({
          where: { id: found.id },
          data: {
            isEssential: true,
            systemCode: template.systemCode,
            category: template.category,
          },
        });
      }
    } else {
      // Create missing essential tracker
      let unit = template.unit;
      if (template.systemCode === "WEIGHT") unit = weightUnit;
      if (template.systemCode === "HEIGHT") unit = heightUnit;

      currentOrder++;
      await prisma.tracker.create({
        data: {
          userId,
          name: template.name,
          category: template.category,
          type: template.type,
          unit,
          targetValue: template.targetValue,
          color: template.color,
          icon: template.icon,
          isEssential: true,
          systemCode: template.systemCode,
          sortOrder: currentOrder,
        },
      });
    }
  }

  // Normalize legacy categories for remaining trackers
  for (const t of existing) {
    const canonical = normalizeCategory(t.category);
    if (t.category !== canonical) {
      await prisma.tracker.update({
        where: { id: t.id },
        data: { category: canonical },
      });
    }
  }
}
