import { prisma } from "@/lib/prisma";

export const TRACKER_CATEGORIES = [
  "Nutrition",
  "Measurements",
  "Training",
  "Habits",
] as const;

export type TrackerCategory = (typeof TRACKER_CATEGORIES)[number];

export interface StandardMeasurementDefinition {
  key: string;
  name: string;
  unit: string;
  defaultTarget?: number;
}

export const STANDARD_BODY_MEASUREMENTS: StandardMeasurementDefinition[] = [
  { key: "neck", name: "Neck", unit: "cm" },
  { key: "shoulders", name: "Shoulders", unit: "cm" },
  { key: "chest", name: "Chest", unit: "cm" },
  { key: "waist", name: "Waist", unit: "cm" },
  { key: "abdomen", name: "Abdomen", unit: "cm" },
  { key: "hips", name: "Hips", unit: "cm" },
  { key: "leftBicep", name: "Left Bicep", unit: "cm" },
  { key: "rightBicep", name: "Right Bicep", unit: "cm" },
  { key: "leftForearm", name: "Left Forearm", unit: "cm" },
  { key: "rightForearm", name: "Right Forearm", unit: "cm" },
  { key: "leftThigh", name: "Left Thigh", unit: "cm" },
  { key: "rightThigh", name: "Right Thigh", unit: "cm" },
  { key: "leftCalf", name: "Left Calf", unit: "cm" },
  { key: "rightCalf", name: "Right Calf", unit: "cm" },
];

export const ESSENTIAL_TRACKERS = [
  // 1. Nutrition Mandatory Cards
  {
    systemCode: "CALORIES",
    name: "Calories",
    category: "Nutrition",
    type: "NUMERIC",
    unit: "kcal",
    targetValue: 2000,
    color: "#f59e0b",
    icon: "Flame",
    isEssential: true,
  },
  {
    systemCode: "PROTEIN",
    name: "Protein",
    category: "Nutrition",
    type: "NUMERIC",
    unit: "g",
    targetValue: 140,
    color: "#ef4444",
    icon: "Activity",
    isEssential: true,
  },
  {
    systemCode: "CARBS",
    name: "Carbohydrates",
    category: "Nutrition",
    type: "NUMERIC",
    unit: "g",
    targetValue: 220,
    color: "#3b82f6",
    icon: "TrendingUp",
    isEssential: true,
  },
  {
    systemCode: "FAT",
    name: "Fat",
    category: "Nutrition",
    type: "NUMERIC",
    unit: "g",
    targetValue: 65,
    color: "#8b5cf6",
    icon: "Heart",
    isEssential: true,
  },

  // 2. Measurements Mandatory Cards
  {
    systemCode: "WEIGHT",
    name: "Weight",
    category: "Measurements",
    type: "NUMERIC",
    unit: "kg",
    targetValue: 70,
    color: "#06b6d4",
    icon: "Scale",
    isEssential: true,
  },
  {
    systemCode: "HEIGHT",
    name: "Height",
    category: "Measurements",
    type: "NUMERIC",
    unit: "cm",
    targetValue: 175,
    color: "#10b981",
    icon: "SlidersHorizontal",
    isEssential: true,
  },
  {
    systemCode: "BMI",
    name: "Body Mass Index (BMI)",
    category: "Measurements",
    type: "CALCULATED",
    unit: "BMI",
    targetValue: 22.0,
    color: "#6366f1",
    icon: "Activity",
    isEssential: true,
  },
];

/**
 * Normalizes legacy category names into the four canonical categories.
 */
export function normalizeCategory(category: string): TrackerCategory {
  const lower = category.toLowerCase().trim();
  if (lower.includes("nutri") || lower.includes("diet") || lower.includes("food")) {
    return "Nutrition";
  }
  if (lower.includes("measure") || lower.includes("body")) {
    return "Measurements";
  }
  if (lower.includes("train") || lower.includes("workout") || lower.includes("gym") || lower.includes("cardio")) {
    return "Training";
  }
  return "Habits";
}

/**
 * Calculates BMI = weight (kg) / (height (m))^2
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm || heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10;
}

export function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi <= 0) return { label: "Pending", color: "text-slate-400" };
  if (bmi < 18.5) return { label: "Underweight", color: "text-amber-400" };
  if (bmi <= 24.9) return { label: "Normal weight", color: "text-emerald-400" };
  if (bmi <= 29.9) return { label: "Overweight", color: "text-amber-400" };
  return { label: "Obese", color: "text-rose-400" };
}

/**
 * Automatically computes and synchronizes BMI log for a date if weight and height are known.
 */
export async function syncUserBMI(userId: string, date: string) {
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
    const bmi = calculateBMI(weightVal, heightVal);

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
          notes: `Auto-computed from ${weightVal}kg and ${heightVal}cm`,
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
 */
export async function ensureEssentialTrackers(userId: string, preferredUnit = "METRIC") {
  const existing = await prisma.tracker.findMany({
    where: { userId },
  });

  const weightUnit = preferredUnit === "IMPERIAL" ? "lbs" : "kg";
  const heightUnit = preferredUnit === "IMPERIAL" ? "in" : "cm";

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
