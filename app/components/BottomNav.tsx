"use client";

import { useState } from "react";

interface OnboardingProps {
  onComplete: (data: {
    age: number;
    height: number;
    weight: number;
    goal: "cut" | "maintain" | "bulk";
    cuisines: string[];
    targetProtein: number;
    targetCalories: number;
  }) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [age, setAge] = useState<number>(20);
  const [height, setHeight] = useState<number>(72);
  const [weight, setWeight] = useState<number>(180);
  const [goal, setGoal] = useState<"cut" | "maintain" | "bulk">("cut");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);

  const targetProtein = Math.round(weight * 1.1);
  const targetCalories = goal === "cut" ? 2100 : goal === "bulk" ? 3100 : 2500;

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
      goal,
      cuisines: selectedCuisines,
      targetProtein,
      targetCalories,
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
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Height (in)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Weight (lbs)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200"
              />
            </div>
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
        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex justify-between items-center text-xs">
          <span className="text-slate-400 font-medium">Calculated Targets:</span>
          <div className="flex space-x-3 font-bold font-mono">
            <span className="text-emerald-400">{targetProtein}g Protein</span>
            <span className="text-blue-400">{targetCalories} kcal</span>
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