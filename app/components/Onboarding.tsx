"use client";

import { useState } from "react";
import { calculateAutoTargets, ACTIVITY_LABELS, type ActivityLevel, type Sex } from "../lib/targets";

interface OnboardingProps {
  onComplete: (data: {
    age: number;
    height: number;
    weight: number;
    sex: Sex;
    activityLevel: ActivityLevel;
    goal: "cut" | "maintain" | "bulk";
    cuisines: string[];
    targetProtein: number;
    targetCalories: number;
    targetCarbs: number;
    targetFat: number;
  }) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  // String-backed state so clearing a field doesn't snap back to "0"
  // while the user is typing — numbers are only parsed at use.
  const [ageStr, setAgeStr] = useState("20");
  const [heightStr, setHeightStr] = useState("72");
  const [weightStr, setWeightStr] = useState("180");
  const [sex, setSex] = useState<Sex>("male");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");
  const [goal, setGoal] = useState<"cut" | "maintain" | "bulk">("cut");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);

  const age = Number(ageStr) || 0;
  const height = Number(heightStr) || 0;
  const weight = Number(weightStr) || 0;

  const targets = calculateAutoTargets(sex, weight, height, age, activityLevel, goal);

  const handleCuisineToggle = (cuisine: string) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine) ? prev.filter((c) => c !== cuisine) : [...prev, cuisine]
    );
  };

  const handleStart = () => {
    onComplete({
      age,
      height,
      weight,
      sex,
      activityLevel,
      goal,
      cuisines: selectedCuisines,
      targetProtein: targets.protein,
      targetCalories: targets.calories,
      targetCarbs: targets.carbs,
      targetFat: targets.fat,
    });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col justify-center max-w-xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-black text-emerald-400 tracking-tight">Diced.</h1>
        <p className="text-slate-400 text-sm mt-2">
          Let's customize your ranked food recommendations to match your fuel goals.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl">
        {/* Biometrics */}
        <div>
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">
            1. Your Metrics
          </h2>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Age</label>
              <input
                type="number"
                inputMode="numeric"
                value={ageStr}
                onChange={(e) => setAgeStr(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Height (in)</label>
              <input
                type="number"
                inputMode="numeric"
                value={heightStr}
                onChange={(e) => setHeightStr(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Weight (lbs)</label>
              <input
                type="number"
                inputMode="numeric"
                value={weightStr}
                onChange={(e) => setWeightStr(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {(["male", "female"] as Sex[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSex(s)}
                className={`py-2 rounded-xl font-bold text-xs uppercase tracking-wider border ${
                  sex === s
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                    : "bg-slate-950 border-slate-800 text-slate-400"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Activity Level</label>
            <select
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200"
            >
              {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((level) => (
                <option key={level} value={level}>{ACTIVITY_LABELS[level]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Goal Selector */}
        <div>
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
            2. Current Fitness Goal
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {(["cut", "maintain", "bulk"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGoal(g)}
                className={`py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border ${
                  goal === g
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Target Preview */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400 font-medium">Calculated Targets:</span>
            <span className="text-blue-400 font-bold font-mono">{targets.calories} kcal</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 font-mono">
            <span>{targets.protein}g P</span>
            <span>{targets.carbs}g C</span>
            <span>{targets.fat}g F</span>
          </div>
        </div>

        {/* Favorite Cuisines */}
        <div>
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
            3. Favorite Cuisines
          </h2>
          <div className="flex flex-wrap gap-2">
            {["Mexican", "Burgers", "Salads", "Korean", "Japanese", "Mediterranean"].map((c) => {
              const active = selectedCuisines.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleCuisineToggle(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    active
                      ? "bg-slate-800 border-slate-600 text-slate-100"
                      : "bg-slate-950 border-slate-800/80 text-slate-400"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={handleStart}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 rounded-xl transition-colors text-sm uppercase tracking-wider"
        >
          Enter Diced Dashboard →
        </button>
      </div>
    </main>
  );
}