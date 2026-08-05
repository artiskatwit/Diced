"use client";

import { useState } from "react";
import initialRestaurants from "../restaurants.json";

interface MenuItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Restaurant {
  id: string;
  name: string;
  userRank: number;
  cuisine: string;
  menuItems: MenuItem[];
}

export default function Home() {
  const [minProtein, setMinProtein] = useState<number>(30);
  const [restaurants] = useState<Restaurant[]>(initialRestaurants);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 max-w-4xl mx-auto font-sans">
      {/* Header */}
      <header className="mb-10 border-b border-slate-800 pb-6">
        <h1 className="text-4xl font-extrabold tracking-tight text-emerald-400">
          Diced.
        </h1>
        <p className="text-slate-400 mt-1 font-medium">
          Ranked restaurant lists filtered by high-protein fuel.
        </p>
      </header>

      {/* Control Panel / Filter Section */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-10 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <label htmlFor="protein-range" className="font-semibold text-lg">
            Minimum Protein Goal
          </label>
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-sm font-bold">
            {minProtein}g+ Protein
          </span>
        </div>
        <input
          id="protein-range"
          type="range"
          min="0"
          max="80"
          step="5"
          value={minProtein}
          onChange={(e) => setMinProtein(Number(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono">
          <span>0g</span>
          <span>40g</span>
          <span>80g</span>
        </div>
      </section>

      {/* Ranked Restaurant List */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold tracking-wide text-slate-300">
          Your Ranked Spots
        </h2>

        {restaurants.map((restaurant) => {
          const matchingItems = restaurant.menuItems.filter(
            (item) => item.protein >= minProtein
          );

          return (
            <div
              key={restaurant.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 transition-all hover:border-slate-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center justify-center w-8 h-8 bg-slate-800 text-slate-300 font-bold text-sm rounded-full border border-slate-700">
                    #{restaurant.userRank}
                  </span>
                  <h3 className="text-2xl font-bold">{restaurant.name}</h3>
                </div>
                <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md">
                  {restaurant.cuisine}
                </span>
              </div>

              {matchingItems.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 mt-4">
                  {matchingItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl flex justify-between items-start"
                    >
                      <div>
                        <p className="font-semibold text-slate-200">{item.name}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {item.calories} kcal | {item.carbs}g C | {item.fat}g F
                        </p>
                      </div>
                      <span className="text-emerald-400 font-bold text-sm bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900">
                        {item.protein}g P
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic mt-2">
                  No items fit {minProtein}g+ protein criteria at this restaurant.
                </p>
              )}
            </div>
          );
        })}
      </section>
    </main>
  );
}