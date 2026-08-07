// app/api/estimate-macros/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

type DishInput = {
  name: string;
  description?: string;
  listedCalories?: number;
  listedProtein?: number;
  listedCarbs?: number;
  listedFat?: number;
};

async function guessNutrition(query: string) {
  if (!process.env.SPOONACULAR_API_KEY) return null;

  const params = new URLSearchParams({
    title: query,
    apiKey: process.env.SPOONACULAR_API_KEY,
  });

  try {
    const res = await fetch(
      `https://api.spoonacular.com/recipes/guessNutrition?${params.toString()}`
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.calories) return null;

    return {
      calories: Math.round(data.calories.value),
      protein: Math.round(data.protein.value),
      carbs: Math.round(data.carbs.value),
      fat: Math.round(data.fat.value),
    };
  } catch {
    return null;
  }
}

async function estimateWithGemini(dish: DishInput) {
  // Using gemini-2.5-flash for speed and lower latency
const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const prompt = `You are a nutrition estimator. Given a restaurant dish name and description, estimate a realistic macro breakdown for a single typical serving.

Dish: ${dish.name}
Description: ${dish.description ?? "none provided"}

Return JSON in this exact shape:
{"calories": number, "protein": number, "carbs": number, "fat": number, "confidence": "low"|"medium"|"high"}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  if (!text) {
    throw new Error("Empty response returned from Gemini API");
  }

  return JSON.parse(text);
}

export async function POST(req: Request) {
  try {
    const { dishes }: { dishes: DishInput[] } = await req.json();

    if (!Array.isArray(dishes)) {
      return NextResponse.json(
        { error: "Invalid request payload. Expected an array of dishes." },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      dishes.map(async (dish) => {
        // 1. Trust listed macros if the menu already has them
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

        // 2. Try Spoonacular with full name + description
        const title = dish.description ? `${dish.name} ${dish.description}` : dish.name;
        let macros = await guessNutrition(title);

        // 3. Retry Spoonacular with just description
        if (!macros && dish.description) {
          macros = await guessNutrition(dish.description);
        }

        if (macros) {
          return { name: dish.name, ...macros, source: "estimated_spoonacular" };
        }

        // 4. Gemini reasoning fallback
        try {
          const geminiResult = await estimateWithGemini(dish);
          return {
            name: dish.name,
            calories: geminiResult.calories,
            protein: geminiResult.protein,
            carbs: geminiResult.carbs,
            fat: geminiResult.fat,
            confidence: geminiResult.confidence,
            source: "estimated_gemini",
          };
        } catch (err) {
          console.error("Gemini fallback failed for:", dish.name, err);
          return {
            name: dish.name,
            error: "estimation_failed",
            source: "none",
            details: String(err),
          };
        }
      })
    );

    return NextResponse.json({ dishes: results });
  } catch (error) {
    console.error("Estimate macros API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}