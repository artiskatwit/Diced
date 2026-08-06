// app/api/estimate-macros/route.ts
import { NextResponse } from "next/server";

type DishInput = {
  name: string;
  description?: string;
  listedCalories?: number;
  listedProtein?: number;
  listedCarbs?: number;
  listedFat?: number;
};

// TEMP: stubbed estimator until Gemini free-tier quota issue is resolved
function mockEstimate(dish: DishInput) {
  return {
    name: dish.name,
    calories: 550,
    protein: 35,
    carbs: 50,
    fat: 20,
    confidence: "low",
    source: "mock",
  };
}

export async function POST(req: Request) {
  const { dishes }: { dishes: DishInput[] } = await req.json();

  const results = dishes.map((dish) => {
    if (dish.listedCalories && dish.listedProtein) {
      return {
        name: dish.name,
        calories: dish.listedCalories,
        protein: dish.listedProtein,
        carbs: dish.listedCarbs ?? null,
        fat: dish.listedFat ?? null,
        source: "listed",
      };
    }
    return mockEstimate(dish);
  });

  return NextResponse.json({ dishes: results });
}