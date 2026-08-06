"use client";

import { useState } from "react";
import initialRestaurants from "../restaurants.json";
import MacroEstimation from "./components/MacroEstimation";

interface UserTargets {
  targetProtein: number;
  targetCalories: number;
}

export default function Home() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState<"feed" | "lists" | "map" | "leaderboard" | "profile">("lists");

  // Onboarding Form State
  const [age, setAge] = useState<string>("20");
  const [height, setHeight] = useState<string>("72");
  const [weight, setWeight] = useState<string>("180");
  const [goal, setGoal] = useState<"cut" | "maintain" | "bulk">("cut");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);

  // Calculated Targets
  const numericWeight = Number(weight) || 0;
  const targetProtein = Math.round(numericWeight * 1.1);
  const targetCalories = goal === "cut" ? 2100 : goal === "bulk" ? 3100 : 2500;

  const handleCuisineToggle = (cuisine: string) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine) ? prev.filter((c) => c !== cuisine) : [...prev, cuisine]
    );
  };

  // -------------------------------------------------------------
  // SCREEN 1: ONBOARDING FLOW
  // -------------------------------------------------------------
  if (!hasCompletedOnboarding) {
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
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="20"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Height (in)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="72"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Weight (lbs)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="180"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
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
            onClick={() => setHasCompletedOnboarding(true)}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 rounded-xl transition-colors text-sm uppercase tracking-wider"
          >
            Enter Diced Dashboard →
          </button>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------------
  // SCREEN 2: DICED MAIN DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 max-w-md mx-auto border-x border-slate-900 shadow-2xl relative">
      {/* Top Header */}
      <header className="p-4 border-b border-slate-900 sticky top-0 bg-slate-950/90 backdrop-blur-md z-10 space-y-3">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-black text-emerald-400 tracking-tight">diced.</h1>
          <div className="flex items-center space-x-2 text-xs font-mono bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            <span className="text-emerald-400 font-bold">{targetProtein}g P</span>
            <span className="text-slate-600">|</span>
            <span className="text-blue-400">{targetCalories} kcal</span>
          </div>
        </div>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Search restaurant, cuisine, or meal..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />

        {/* Quick Filter Chips */}
        <div className="flex space-x-2 overflow-x-auto text-[11px] no-scrollbar">
          <button className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full whitespace-nowrap font-bold">
            🔥 High Protein Hits
          </button>
          <button className="bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1 rounded-full whitespace-nowrap">
            📍 Nearby
          </button>
          <button className="bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1 rounded-full whitespace-nowrap">
            ⭐ Highest Ranked
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-4 space-y-4">
        {activeTab === "lists" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-2">
              <span>YOUR RANKED SPOTS</span>
            </div>
            {initialRestaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-6 h-6 bg-slate-800 text-emerald-400 rounded-full flex items-center justify-center font-bold text-xs border border-slate-700">
                      #{restaurant.userRank}
                    </span>
                    <h3 className="font-bold text-base text-slate-100">{restaurant.name}</h3>
                  </div>
                  <span className="text-[10px] font-semibold bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                    {restaurant.cuisine}
                  </span>
                </div>

                <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-slate-200">
                      {restaurant.menuItems[0].name}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      {restaurant.menuItems[0].calories} kcal | {restaurant.menuItems[0].carbs}g C | {restaurant.menuItems[0].fat}g F
                    </p>
                  </div>
                  <span className="text-emerald-400 text-xs font-extrabold bg-emerald-950/60 px-2 py-1 rounded border border-emerald-900/80">
                    {restaurant.menuItems[0].protein}g P
                  </span>
                </div>
                 <MacroEstimation
                  menuItems={restaurant.menuItems}
                  targetProtein={targetProtein}
                  targetCalories={targetCalories}
                />
              </div>
              
             
            ))}
          </div>
        )}

        {activeTab === "map" && (
          <div className="p-8 text-center text-slate-500 text-xs font-semibold">
            Map View
          </div>
        )}

        {activeTab === "feed" && (
          <div className="p-8 text-center text-slate-500 text-xs font-semibold">
            Activity Feed
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div className="p-8 text-center text-slate-500 text-xs font-semibold">
            Leaderboard
          </div>
        )}

        {activeTab === "profile" && (
          <div className="p-8 text-center text-slate-500 text-xs font-semibold">
            Profile Settings
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-950/95 backdrop-blur-lg border-t border-slate-900 p-3 flex justify-around items-center text-[10px] font-semibold text-slate-400 z-20">
        <button
          onClick={() => setActiveTab("lists")}
          className={`flex flex-col items-center space-y-0.5 ${
            activeTab === "lists" ? "text-emerald-400" : "hover:text-slate-200"
          }`}
        >
          <span className="text-base">📋</span>
          <span>Lists</span>
        </button>
        <button
          onClick={() => setActiveTab("map")}
          className={`flex flex-col items-center space-y-0.5 ${
            activeTab === "map" ? "text-emerald-400" : "hover:text-slate-200"
          }`}
        >
          <span className="text-base">🗺️</span>
          <span>Map</span>
        </button>
        <button className="bg-emerald-500 text-slate-950 p-2.5 rounded-full font-black text-sm -mt-5 shadow-lg shadow-emerald-500/20">
          ＋
        </button>
        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`flex flex-col items-center space-y-0.5 ${
            activeTab === "leaderboard" ? "text-emerald-400" : "hover:text-slate-200"
          }`}
        >
          <span className="text-base">🏆</span>
          <span>Leaderboard</span>
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center space-y-0.5 ${
            activeTab === "profile" ? "text-emerald-400" : "hover:text-slate-200"
          }`}
        >
          <span className="text-base">👤</span>
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
}