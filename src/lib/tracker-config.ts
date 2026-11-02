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
 * Normalizes category names into the four canonical categories.
 */
export function normalizeCategory(category: string): TrackerCategory {
  const lower = category.toLowerCase().trim();
  if (lower.includes("nutri") || lower.includes("diet") || lower.includes("food")) {
    return "Nutrition";
  }
  if (lower.includes("measure") || lower.includes("body")) {
    return "Measurements";
  }
  if (
    lower.includes("train") ||
    lower.includes("workout") ||
    lower.includes("gym") ||
    lower.includes("cardio")
  ) {
    return "Training";
  }
  return "Habits";
}

/**
 * Calculates BMI = weight (kg) / (height (m))^2
 * Handles both Metric (kg/cm) and Imperial (lbs/in) units.
 */
export function calculateBMI(
  weight: number,
  height: number,
  weightUnit: string = "kg",
  heightUnit: string = "cm"
): number {
  if (!weight || !height || height <= 0 || weight <= 0) return 0;

  let weightKg = weight;
  if (weightUnit.toLowerCase().includes("lb")) {
    weightKg = weight * 0.45359237;
  }

  let heightM = height / 100;
  if (heightUnit.toLowerCase().includes("in")) {
    heightM = (height * 2.54) / 100;
  } else if (heightUnit.toLowerCase().includes("ft")) {
    heightM = (height * 30.48) / 100;
  }

  if (heightM <= 0) return 0;
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
