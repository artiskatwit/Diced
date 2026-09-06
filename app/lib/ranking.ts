export interface LoggedMeal {
  id: string;
  restaurantId: string;
  restaurantName: string;
  cuisine?: string;
  dishName: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  macroScore: number;
  tasteScore: number;
  combinedScore: number;
  photoUrl?: string;
  createdAt: string;
}

export function combineScore(macroScore: number, tasteScore: number): number {
  const combined = (macroScore + tasteScore) / 2;
  return Math.round(combined * 10) / 10;
}

interface RestaurantRankEntry {
  restaurantId: string;
  restaurantName: string;
  cuisine?: string;
  avgCombinedScore: number;
  mealCount: number;
  bestMeal: LoggedMeal;
  allMeals: LoggedMeal[];
}

// Groups logged meals by restaurant and ranks restaurants by their average
// combined score across every meal the user has logged there.
export function rankLoggedMeals(meals: LoggedMeal[]): (RestaurantRankEntry & { computedRank: number })[] {
  const groups = new Map<string, LoggedMeal[]>();

  for (const meal of meals) {
    const existing = groups.get(meal.restaurantId) ?? [];
    existing.push(meal);
    groups.set(meal.restaurantId, existing);
  }

  const entries: RestaurantRankEntry[] = Array.from(groups.entries()).map(([restaurantId, mealsAtSpot]) => {
    const avg =
      mealsAtSpot.reduce((sum, m) => sum + m.combinedScore, 0) / mealsAtSpot.length;
    const best = [...mealsAtSpot].sort((a, b) => b.combinedScore - a.combinedScore)[0];

    return {
      restaurantId,
      restaurantName: best.restaurantName,
      cuisine: best.cuisine,
      avgCombinedScore: Math.round(avg * 10) / 10,
      mealCount: mealsAtSpot.length,
      bestMeal: best,
      allMeals: mealsAtSpot,
    };
  });

  entries.sort((a, b) => b.avgCombinedScore - a.avgCombinedScore);

  return entries.map((e, i) => ({ ...e, computedRank: i + 1 }));
}