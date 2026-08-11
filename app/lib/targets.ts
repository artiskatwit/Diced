export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Sex = "male" | "female";
export type Goal = "cut" | "maintain" | "bulk";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary (little/no exercise)",
  light: "Light (1-3 days/week)",
  moderate: "Moderate (3-5 days/week)",
  active: "Active (6-7 days/week)",
  very_active: "Very Active (intense daily)",
};

// Mifflin-St Jeor equation — the standard, well-validated BMR formula
export function calculateBMR(sex: Sex, weightLbs: number, heightIn: number, age: number): number {
  const weightKg = weightLbs * 0.453592;
  const heightCm = heightIn * 2.54;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

export function calculateCalorieTarget(tdee: number, goal: Goal): number {
  if (goal === "cut") return Math.round(tdee - 500);
  if (goal === "bulk") return Math.round(tdee + 400);
  return Math.round(tdee);
}

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Full auto-calculated target set: real TDEE for calories, protein based on
// bodyweight (1.1g/lb, standard for active individuals), remaining calories
// split 65/35 carbs/fat by default.
export function calculateAutoTargets(
  sex: Sex,
  weightLbs: number,
  heightIn: number,
  age: number,
  activityLevel: ActivityLevel,
  goal: Goal
): MacroTargets {
  const bmr = calculateBMR(sex, weightLbs, heightIn, age);
  const tdee = calculateTDEE(bmr, activityLevel);
  const calories = calculateCalorieTarget(tdee, goal);

  const protein = Math.round(weightLbs * 1.1);
  const proteinCals = protein * 4;
  const remainingCals = Math.max(calories - proteinCals, 0);
  const fat = Math.round((remainingCals * 0.35) / 9);
  const carbs = Math.round((remainingCals * 0.65) / 4);

  return { calories, protein, carbs, fat };
}

// Ratios mode: convert % targets into grams given an energy target
export function ratiosToGrams(
  calories: number,
  proteinPct: number,
  carbsPct: number,
  fatPct: number
): MacroTargets {
  return {
    calories,
    protein: Math.round((calories * (proteinPct / 100)) / 4),
    carbs: Math.round((calories * (carbsPct / 100)) / 4),
    fat: Math.round((calories * (fatPct / 100)) / 9),
  };
}

export function gramsToCalories(protein: number, carbs: number, fat: number): number {
  return Math.round(protein * 4 + carbs * 4 + fat * 9);
}