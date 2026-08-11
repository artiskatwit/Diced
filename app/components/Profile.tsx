"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import { ratiosToGrams, gramsToCalories, type MacroTargets } from "../lib/targets";

interface ProfileProps {
  email: string | undefined;
  targets: MacroTargets;
  weight: number;
  onUpdateTargets: (targets: MacroTargets) => void;
  mealsLoggedCount: number;
  restaurantsRankedCount: number;
}

export default function Profile({
  email,
  targets,
  weight,
  onUpdateTargets,
  mealsLoggedCount,
  restaurantsRankedCount,
}: ProfileProps) {
  const [editing, setEditing] = useState(false);
  const [mode, setMode] = useState<"ratios" | "fixed">("ratios");

  // All editable numeric fields use STRING state so users can freely clear
  // and retype without a stray "0" reappearing on every keystroke.
  const [caloriesStr, setCaloriesStr] = useState(String(targets.calories));

  const proteinPerLbInitial = Math.round((targets.protein / weight) * 100) / 100;
  const [proteinPerLbStr, setProteinPerLbStr] = useState(String(proteinPerLbInitial || 1.1));

  const carbsPctInitial = Math.round(((targets.carbs * 4) / targets.calories) * 100) || 40;
  const fatPctInitial = 100 - carbsPctInitial - Math.round(((targets.protein * 4) / targets.calories) * 100);
  const [carbsPctStr, setCarbsPctStr] = useState(String(carbsPctInitial));
  const [fatPctStr, setFatPctStr] = useState(String(fatPctInitial > 0 ? fatPctInitial : 25));

  const [carbsGStr, setCarbsGStr] = useState(String(targets.carbs));
  const [fatGStr, setFatGStr] = useState(String(targets.fat));

  // Parse helpers — empty string reads as 0 for calculation purposes only,
  // never forced back into the input while the user is typing.
  const calories = Number(caloriesStr) || 0;
  const proteinPerLb = Number(proteinPerLbStr) || 0;
  const carbsPct = Number(carbsPctStr) || 0;
  const fatPct = Number(fatPctStr) || 0;
  const carbsG = Number(carbsGStr) || 0;
  const fatG = Number(fatGStr) || 0;

  const proteinFromLb = Math.round(proteinPerLb * weight);

  // Ratios mode: protein comes from g/lb (not %), carbs & fat fill the rest by %
  const ratiosPreview = {
    protein: proteinFromLb,
    carbs: Math.round((calories * (carbsPct / 100)) / 4),
    fat: Math.round((calories * (fatPct / 100)) / 9),
  };
  const proteinPctOfCalories = calories > 0 ? Math.round(((proteinFromLb * 4) / calories) * 100) : 0;
  const pctTotal = proteinPctOfCalories + carbsPct + fatPct;

  const fixedCalories = gramsToCalories(proteinFromLb, carbsG, fatG);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  function handleSave() {
    if (mode === "ratios") {
      onUpdateTargets({
        calories,
        protein: proteinFromLb,
        carbs: ratiosPreview.carbs,
        fat: ratiosPreview.fat,
      });
    } else {
      onUpdateTargets({
        calories: fixedCalories,
        protein: proteinFromLb,
        carbs: carbsG,
        fat: fatG,
      });
    }
    setEditing(false);
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-1 text-center">
        <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-2">
          <span className="text-emerald-400 font-black text-lg">
            {email ? email[0].toUpperCase() : "?"}
          </span>
        </div>
        <p className="text-slate-100 font-bold text-sm">{email}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-emerald-400">{mealsLoggedCount}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-1">Meals Logged</p>
        </div>
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-emerald-400">{restaurantsRankedCount}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-1">Restaurants Ranked</p>
        </div>
      </div>

      {/* Targets + Profile */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Targets + Profile</p>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-[11px] text-emerald-400 font-bold"
            >
              Edit
            </button>
          )}
        </div>

        {!editing && (
          <>
            <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Energy Target</p>
              <p className="text-xl font-black text-blue-400">{targets.calories} kcal</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-950 border border-slate-800/60 rounded-lg p-2">
                <p className="text-emerald-400 font-bold text-sm">{targets.protein}g</p>
                <p className="text-[9px] text-slate-500 uppercase">Protein</p>
              </div>
              <div className="bg-slate-950 border border-slate-800/60 rounded-lg p-2">
                <p className="text-yellow-400 font-bold text-sm">{targets.carbs}g</p>
                <p className="text-[9px] text-slate-500 uppercase">Carbs</p>
              </div>
              <div className="bg-slate-950 border border-slate-800/60 rounded-lg p-2">
                <p className="text-orange-400 font-bold text-sm">{targets.fat}g</p>
                <p className="text-[9px] text-slate-500 uppercase">Fat</p>
              </div>
            </div>
          </>
        )}

        {editing && (
          <div className="space-y-4">
            {/* Energy Target */}
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wide block mb-1">
                Energy Target
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={caloriesStr}
                onChange={(e) => setCaloriesStr(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 font-mono"
              />
            </div>

            {/* Protein by bodyweight — same in both modes */}
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-wide block mb-1">
                Protein (g per lb bodyweight)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  value={proteinPerLbStr}
                  onChange={(e) => setProteinPerLbStr(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 font-mono"
                />
                <span className="text-[11px] text-slate-500 whitespace-nowrap">
                  = {proteinFromLb}g (at {weight}lb)
                </span>
              </div>
            </div>

            {/* Ratios / Fixed toggle */}
            <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex">
              <button
                onClick={() => setMode("ratios")}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  mode === "ratios" ? "bg-emerald-500 text-slate-950" : "text-slate-400"
                }`}
              >
                Ratios
              </button>
              <button
                onClick={() => setMode("fixed")}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  mode === "fixed" ? "bg-emerald-500 text-slate-950" : "text-slate-400"
                }`}
              >
                Fixed Targets
              </button>
            </div>

            {mode === "ratios" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400 w-16">Protein</span>
                  <span className="text-xs text-slate-500 flex-1">{proteinPctOfCalories}% (from g/lb above)</span>
                  <span className="text-[10px] text-slate-500 font-mono">{ratiosPreview.protein}g</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400 w-16">Carbs</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={carbsPctStr}
                    onChange={(e) => setCarbsPctStr(e.target.value)}
                    className="w-16 bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-center text-slate-200"
                  />
                  <span className="text-xs text-slate-500">%</span>
                  <span className="text-[10px] text-slate-500 font-mono ml-auto">{ratiosPreview.carbs}g</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400 w-16">Fat</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={fatPctStr}
                    onChange={(e) => setFatPctStr(e.target.value)}
                    className="w-16 bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-center text-slate-200"
                  />
                  <span className="text-xs text-slate-500">%</span>
                  <span className="text-[10px] text-slate-500 font-mono ml-auto">{ratiosPreview.fat}g</span>
                </div>
                <p className={`text-[10px] text-right ${pctTotal === 100 ? "text-emerald-400" : "text-red-400"}`}>
                  {pctTotal}% total {pctTotal !== 100 && "(should be 100%)"}
                </p>
              </div>
            )}

            {mode === "fixed" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400 w-16">Protein</span>
                  <span className="flex-1 text-xs text-slate-500">{proteinFromLb}g (from g/lb above)</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400 w-16">Carbs</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={carbsGStr}
                    onChange={(e) => setCarbsGStr(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200"
                  />
                  <span className="text-xs text-slate-500">g</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400 w-16">Fat</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={fatGStr}
                    onChange={(e) => setFatGStr(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200"
                  />
                  <span className="text-xs text-slate-500">g</span>
                </div>
                <p className="text-[10px] text-slate-500 text-right">
                  = {fixedCalories} kcal from macros
                </p>
              </div>
            )}

            <div className="flex space-x-2">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 bg-slate-950 border border-slate-800 text-slate-400 font-bold py-2.5 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-emerald-500 text-slate-950 font-black py-2.5 rounded-lg text-xs uppercase"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        className="w-full bg-slate-900 border border-red-900/50 text-red-400 font-bold py-3 rounded-xl text-sm"
      >
        Sign Out
      </button>
    </div>
  );
}