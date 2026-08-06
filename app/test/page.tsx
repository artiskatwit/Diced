"use client";

import { useState } from "react";
import restaurants from "@/restaurants.json";

type MenuItem = {
  name: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
};

type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  menuItems: MenuItem[];
};

type MacroResult = {
  name: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  source?: string;
  confidence?: string;
  error?: string;
};

export default function TestPage() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("");
  const [results, setResults] = useState<MacroResult[]>([]);
  const [loading, setLoading] = useState(false);

  const data = restaurants as Restaurant[];

  async function handleEstimateMenu(restaurantName: string) {
    const restaurant = data.find((r) => r.name === restaurantName);
    if (!restaurant?.menuItems) return;

    setLoading(true);
    setResults([]);

    // Map menuItems -> the shape /api/estimate-macros expects
    const dishes = restaurant.menuItems.map((item) => ({
      name: item.name,
      listedCalories: item.calories,
      listedProtein: item.protein,
      listedCarbs: item.carbs,
      listedFat: item.fat,
    }));

    const res = await fetch("/api/estimate-macros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dishes }),
    });

    const json = await res.json();
    setResults(json.dishes);
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>Diced — Menu Macro Test</h1>

      <select
        value={selectedRestaurant}
        onChange={(e) => setSelectedRestaurant(e.target.value)}
        style={{ padding: 8, width: "100%" }}
      >
        <option value="">Select a restaurant</option>
        {data.map((r) => (
          <option key={r.id} value={r.name}>
            {r.name} ({r.cuisine})
          </option>
        ))}
      </select>

      <button
        onClick={() => handleEstimateMenu(selectedRestaurant)}
        disabled={!selectedRestaurant || loading}
        style={{ marginTop: 12, padding: "8px 16px" }}
      >
        {loading ? "Loading menu..." : "Show Menu Macros"}
      </button>

      <div style={{ marginTop: 24 }}>
        {results.map((r, i) => (
          <div
            key={i}
            style={{
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <strong>{r.name}</strong>
            {r.error ? (
              <p style={{ color: "red" }}>Error: {r.error}</p>
            ) : (
              <p>
                {r.calories} cal · {r.protein}g protein · {r.carbs}g carbs · {r.fat}g fat
                <br />
                <span style={{ fontSize: 12, color: "#666" }}>
                  source: {r.source}
                </span>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}