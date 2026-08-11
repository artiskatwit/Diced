"use client";

import { useState, useEffect } from "react";
import { combineScore, type LoggedMeal } from "../lib/ranking";

interface MenuItemLike {
  name: string;
  calories: number;
  protein: number;
  carbs?: number;
  fat?: number;
}

interface RestaurantOption {
  id: string;
  name: string;
  cuisine?: string;
  menuItems?: MenuItemLike[] | null;
}

interface LogMealModalProps {
  restaurants: RestaurantOption[];
  editingMeal?: LoggedMeal | null;
  onClose: () => void;
  onSave: (meal: LoggedMeal) => void;
}

type Step = "details" | "macro" | "taste" | "review";

export default function LogMealModal({
  restaurants,
  editingMeal,
  onClose,
  onSave,
}: LogMealModalProps) {
  const [step, setStep] = useState<Step>("details");

  const [restaurantId, setRestaurantId] = useState(editingMeal?.restaurantId ?? "");
  const [dishName, setDishName] = useState(editingMeal?.dishName ?? "");
  const [calories, setCalories] = useState(editingMeal?.calories?.toString() ?? "");
  const [protein, setProtein] = useState(editingMeal?.protein?.toString() ?? "");
  const [carbs, setCarbs] = useState(editingMeal?.carbs?.toString() ?? "");
  const [fat, setFat] = useState(editingMeal?.fat?.toString() ?? "");

  const [macroScore, setMacroScore] = useState(editingMeal?.macroScore ?? 5);
  const [tasteScore, setTasteScore] = useState(editingMeal?.tasteScore ?? 5);

  const selectedRestaurant = restaurants.find((r) => r.id === restaurantId);

  function handleMenuItemPick(item: MenuItemLike) {
    setDishName(item.name);
    setCalories(String(item.calories));
    setProtein(String(item.protein));
    setCarbs(item.carbs !== undefined ? String(item.carbs) : "");
    setFat(item.fat !== undefined ? String(item.fat) : "");
  }

  function handleSave() {
    if (!selectedRestaurant || !dishName) return;

    const meal: LoggedMeal = {
      id: editingMeal?.id ?? `${Date.now()}`,
      restaurantId: selectedRestaurant.id,
      restaurantName: selectedRestaurant.name,
      cuisine: selectedRestaurant.cuisine,
      dishName,
      calories: calories ? Number(calories) : undefined,
      protein: protein ? Number(protein) : undefined,
      carbs: carbs ? Number(carbs) : undefined,
      fat: fat ? Number(fat) : undefined,
      macroScore,
      tasteScore,
      combinedScore: combineScore(macroScore, tasteScore),
      createdAt: editingMeal?.createdAt ?? new Date().toISOString(),
    };

    onSave(meal);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center">
      <div className="bg-slate-950 border-t border-slate-800 rounded-t-3xl w-full max-w-md p-5 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-black text-emerald-400">
            {editingMeal ? "Edit Ranking" : "Log a Meal"}
          </h2>
          <button onClick={onClose} className="text-slate-500 text-sm">✕</button>
        </div>

        {/* Step indicator */}
        <div className="flex space-x-1.5">
          {(["details", "macro", "taste", "review"] as Step[]).map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${
                step === s ? "bg-emerald-500" : "bg-slate-800"
              }`}
            />
          ))}
        </div>

        {/* STEP 1: Details */}
        {step === "details" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Restaurant</label>
              <select
                value={restaurantId}
                onChange={(e) => {
                  setRestaurantId(e.target.value);
                  setDishName("");
                  setCalories("");
                  setProtein("");
                  setCarbs("");
                  setFat("");
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200"
              >
                <option value="">Select a restaurant</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {selectedRestaurant?.menuItems && selectedRestaurant.menuItems.length > 0 && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">Pick from menu (optional)</label>
                <div className="flex flex-wrap gap-2">
                  {selectedRestaurant.menuItems.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => handleMenuItemPick(item)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        dishName === item.name
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                          : "bg-slate-900 border-slate-800 text-slate-300"
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-slate-400 block mb-1">Dish name</label>
              <input
                type="text"
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                placeholder="e.g. Grilled chicken bowl"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Macros (optional)</label>
              <div className="grid grid-cols-4 gap-2">
                <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="Cal" className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200" />
                <input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="Protein" className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200" />
                <input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="Carbs" className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200" />
                <input type="number" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="Fat" className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep("macro")}
              disabled={!restaurantId || !dishName}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-black py-3 rounded-xl transition-colors text-sm uppercase tracking-wider"
            >
              Next: Macro Rating →
            </button>
          </div>
        )}

        {/* STEP 2: Macro rating */}
        {step === "macro" && (
          <div className="space-y-6">
            <div className="text-center py-4">
              <p className="text-slate-300 text-sm mb-1">How macro-friendly did this meal feel?</p>
              <p className="text-[11px] text-slate-500">1 = way off your goals, 10 = perfect fit</p>
            </div>

            <div className="text-center">
              <span className="text-4xl font-black text-emerald-400">{macroScore}</span>
              <span className="text-slate-500 text-sm">/10</span>
            </div>

            <input
              type="range"
              min={1}
              max={10}
              value={macroScore}
              onChange={(e) => setMacroScore(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setStep("details")}
                className="flex-1 bg-slate-900 border border-slate-800 text-slate-300 font-bold py-3 rounded-xl text-sm"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep("taste")}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-sm uppercase tracking-wider"
              >
                Next: Taste →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Taste rating */}
        {step === "taste" && (
          <div className="space-y-6">
            <div className="text-center py-4">
              <p className="text-slate-300 text-sm mb-1">How did it taste?</p>
              <p className="text-[11px] text-slate-500">1 = not good, 10 = incredible</p>
            </div>

            <div className="text-center">
              <span className="text-4xl font-black text-emerald-400">{tasteScore}</span>
              <span className="text-slate-500 text-sm">/10</span>
            </div>

            <input
              type="range"
              min={1}
              max={10}
              value={tasteScore}
              onChange={(e) => setTasteScore(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setStep("macro")}
                className="flex-1 bg-slate-900 border border-slate-800 text-slate-300 font-bold py-3 rounded-xl text-sm"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep("review")}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-sm uppercase tracking-wider"
              >
                Next: Review →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Review */}
        {step === "review" && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 space-y-3">
              <div>
                <p className="font-bold text-slate-100">{dishName}</p>
                <p className="text-xs text-slate-500">{selectedRestaurant?.name}</p>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Macro fit</span>
                <span className="text-emerald-400 font-bold">{macroScore}/10</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Taste</span>
                <span className="text-emerald-400 font-bold">{tasteScore}/10</span>
              </div>
              <div className="flex justify-between text-sm border-t border-slate-800 pt-3">
                <span className="text-slate-300 font-bold">Overall Score</span>
                <span className="text-emerald-400 font-black text-lg">
                  {combineScore(macroScore, tasteScore)}/10
                </span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setStep("taste")}
                className="flex-1 bg-slate-900 border border-slate-800 text-slate-300 font-bold py-3 rounded-xl text-sm"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-sm uppercase tracking-wider"
              >
                {editingMeal ? "Save Changes" : "Save Ranking"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}