"use client";

import { useState, useEffect } from "react";
import initialRestaurants from "../../restaurants.json";
import BottomNav from "./BottomNav";
import MacroEstimation from "./MacroEstimation";

interface DicedDashboardProps {
  userTargets: {
    targetProtein: number;
    targetCalories: number;
  };
}

export default function DicedDashboard({ userTargets }: DicedDashboardProps) {
  const [activeTab, setActiveTab] = useState<"feed" | "lists" | "map" | "leaderboard" | "profile">("lists");
  const [listView, setListView] = useState<"ranked" | "nearby">("ranked");

  const [nearbyRestaurants, setNearbyRestaurants] = useState<any[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    loadNearbyRestaurants();
  }, []);

  function loadNearbyRestaurants() {
    setLoadingNearby(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Location not supported on this device");
      setLoadingNearby(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `/api/nearby-restaurants?lat=${latitude}&lng=${longitude}`
          );
          const data = await res.json();

          // Match Places results against seeded restaurants by name.
          // If a nearby place matches one we already have menuItems for
          // (e.g. a real Chipotle near the user), attach that menu instead
          // of showing "menu not available."
          const merged = (data.restaurants ?? []).map((place: any) => {
            const seeded = initialRestaurants.find((r) =>
              place.name.toLowerCase().includes(r.name.toLowerCase())
            );
            return {
              ...place,
              menuItems: seeded?.menuItems ?? null,
            };
          });

          setNearbyRestaurants(merged);
        } catch (err) {
          setLocationError("Failed to load nearby restaurants");
        }
        setLoadingNearby(false);
      },
      () => {
        setLocationError("Location permission denied");
        setLoadingNearby(false);
      }
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 max-w-md mx-auto border-x border-slate-900 shadow-2xl relative">
      {/* Top Diced Header */}
      <header className="p-4 border-b border-slate-900 sticky top-0 bg-slate-950/90 backdrop-blur-md z-10 space-y-3">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-black text-emerald-400 tracking-tight">diced.</h1>
          <div className="flex items-center space-x-2 text-xs font-mono bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            <span className="text-emerald-400 font-bold">{userTargets.targetProtein}g P</span>
            <span className="text-slate-600">|</span>
            <span className="text-blue-400">{userTargets.targetCalories} kcal</span>
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
          <button
            onClick={() => setListView("nearby")}
            className={`px-3 py-1 rounded-full whitespace-nowrap border ${
              listView === "nearby"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold"
                : "bg-slate-900 border-slate-800 text-slate-300"
            }`}
          >
            📍 Nearby
          </button>
          <button
            onClick={() => setListView("ranked")}
            className={`px-3 py-1 rounded-full whitespace-nowrap border ${
              listView === "ranked"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold"
                : "bg-slate-900 border-slate-800 text-slate-300"
            }`}
          >
            ⭐ Highest Ranked
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-4 space-y-4">
        {/* Toggle List / Map View */}
        <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-2">
          <span>{listView === "ranked" ? "YOUR RANKED SPOTS" : "NEARBY"}</span>
          <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 flex space-x-1">
            <button
              onClick={() => setActiveTab("lists")}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === "lists" ? "bg-slate-800 text-slate-100" : "text-slate-500"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setActiveTab("map")}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === "map" ? "bg-slate-800 text-slate-100" : "text-slate-500"
              }`}
            >
              Map
            </button>
          </div>
        </div>

        {listView === "ranked" &&
          initialRestaurants.map((restaurant) => (
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

              {/* Top High-Protein Match */}
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
                targetProtein={userTargets.targetProtein}
                targetCalories={userTargets.targetCalories}
              />
            </div>
          ))}

        {listView === "nearby" && (
          <>
            {loadingNearby && (
              <p className="text-[11px] text-slate-500 text-center py-4">Loading nearby spots...</p>
            )}

            {locationError && (
              <p className="text-[11px] text-red-400 mb-2">{locationError}</p>
            )}

            {!loadingNearby && !locationError && nearbyRestaurants.length === 0 && (
              <p className="text-[11px] text-slate-500 text-center py-6">
                No nearby restaurants found.
              </p>
            )}

            {nearbyRestaurants.map((restaurant) => (
              <div
                key={restaurant.placeId}
                className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-base text-slate-100">{restaurant.name}</h3>
                  <span className="text-[10px] font-semibold bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                    {restaurant.cuisine ?? "restaurant"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">{restaurant.address}</p>
                {restaurant.rating && (
                  <span className="text-[10px] text-emerald-400 font-mono">
                    ⭐ {restaurant.rating}
                  </span>
                )}

                {restaurant.menuItems ? (
                  <MacroEstimation
                    menuItems={restaurant.menuItems}
                    targetProtein={userTargets.targetProtein}
                    targetCalories={userTargets.targetCalories}
                  />
                ) : (
                  <div className="text-[11px] text-slate-500 italic border border-slate-800/60 rounded-lg p-2 text-center">
                    Menu not yet available — be the first to add a dish
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}