"use client";

import { useState } from "react";

interface MenuItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MacroEstimationProps {
  menuItems: MenuItem[];
  targetProtein: number;
  targetCalories: number;
}

export default function MacroEstimation({
  menuItems,
  targetProtein,
  targetCalories,
}: MacroEstimationProps) {
  const [expanded, setExpanded] = useState(false);

  function fitScore(item: MenuItem): number {
    const calDiff = Math.abs(item.calories - targetCalories) / targetCalories;
    const proteinDiff = Math.abs(item.protein - targetProtein) / targetProtein;
    // Protein weighted heavier — it's usually the harder target to hit eating out
    return calDiff + proteinDiff * 1.5;
  }

  const sortedItems = [...menuItems].sort((a, b) => fitScore(a) - fitScore(b));

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full text-[11px] font-bold text-emerald-400 py-2 border border-emerald-900/60 rounded-lg bg-emerald-950/30 hover:bg-emerald-950/50 transition-colors"
      >
        {expanded ? "Hide full menu ▲" : "See full menu & macro fit ▼"}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {sortedItems.map((item, i) => (
            <div
              key={item.name}
              className={`relative bg-slate-950 border rounded-xl p-3 flex justify-between items-center ${
                i === 0 ? "border-emerald-500/60" : "border-slate-800/60"
              }`}
            >
              {i === 0 && (
                <div className="absolute -top-2 left-3 bg-emerald-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                  Best Fit
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-slate-200">{item.name}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                  {item.calories} kcal | {item.carbs}g C | {item.fat}g F
                </p>
              </div>
              <span className="text-emerald-400 text-xs font-extrabold bg-emerald-950/60 px-2 py-1 rounded border border-emerald-900/80 whitespace-nowrap">
                {item.protein}g P
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}