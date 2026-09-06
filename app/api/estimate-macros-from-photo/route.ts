import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { imageBase64, mimeType, restaurantName } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash-lite",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `You are a nutrition estimator. Look at this photo of a meal and identify what dish it is, then estimate a realistic macro breakdown for the portion shown.

${restaurantName ? `This meal is from: ${restaurantName}. If you recognize this as a specific menu item from this chain, use your knowledge of their actual published nutrition facts.` : ""}

Return JSON in this exact shape, no prose:
{"dishName": "your best guess at what this dish is called", "calories": number, "protein": number, "carbs": number, "fat": number, "confidence": "low"|"medium"|"high"}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType || "image/jpeg",
        },
      },
    ]);

    const text = result.response.text();
    if (!text) {
      return NextResponse.json({ error: "empty_response" }, { status: 500 });
    }

    const parsed = JSON.parse(text);

    return NextResponse.json({
      dishName: parsed.dishName,
      calories: parsed.calories,
      protein: parsed.protein,
      carbs: parsed.carbs,
      fat: parsed.fat,
      confidence: parsed.confidence,
      source: "estimated_gemini_photo",
    });
  } catch (err) {
    console.error("Photo estimation failed:", err);
    return NextResponse.json({ error: "estimation_failed", details: String(err) }, { status: 500 });
  }
}