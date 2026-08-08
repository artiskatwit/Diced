// app/api/nearby-restaurants/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const CUISINE_OPTIONS = [
  "Mexican", "Burgers", "Salads", "Korean", "Japanese", "Mediterranean",
  "Italian", "American", "Seafood", "Chinese", "Thai", "Indian",
  "Pizza", "Cafe", "Bakery", "BBQ", "Vietnamese", "Fine Dining", "Other",
];

// In-memory cache: placeId -> cuisine. Persists across requests as long as
// the dev server keeps running, so we never pay to reclassify the same
// restaurant twice.
const cuisineCache = new Map<string, string>();

async function classifyCuisine(placeId: string, name: string, placesType: string | null): Promise<string> {
  const cached = cuisineCache.get(placeId);
  if (cached) return cached;

  const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash-lite",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `Classify this restaurant's primary cuisine based on its name and category.

Restaurant name: ${name}
Google category: ${placesType ?? "unknown"}

Pick exactly ONE cuisine from this list: ${CUISINE_OPTIONS.join(", ")}

Respond ONLY with JSON: {"cuisine": "one of the options above"}`;

  let cuisine = "Other";
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);
    cuisine = CUISINE_OPTIONS.includes(parsed.cuisine) ? parsed.cuisine : "Other";
  } catch {
    cuisine = "Other";
  }

  cuisineCache.set(placeId, cuisine);
  return cuisine;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json(
      { error: "lat and lng query params are required" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchNearby",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY!,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.rating",
        },
        body: JSON.stringify({
          includedTypes: ["restaurant"],
          maxResultCount: 15,
          locationRestriction: {
            circle: {
              center: { latitude: Number(lat), longitude: Number(lng) },
              radius: 1500.0,
            },
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("Places API error:", errText);
      return NextResponse.json({ error: "places_fetch_failed", details: errText }, { status: 500 });
    }

    const data = await res.json();

    const restaurants = await Promise.all(
      (data.places ?? []).map(async (place: any) => {
        const name = place.displayName?.text ?? "Unknown";
        const cuisine = await classifyCuisine(place.id, name, place.primaryType ?? null);

        return {
          placeId: place.id,
          name,
          address: place.formattedAddress,
          lat: place.location?.latitude,
          lng: place.location?.longitude,
          cuisine,
          rating: place.rating ?? null,
        };
      })
    );

    return NextResponse.json({ restaurants });
  } catch (err) {
    console.error("Nearby restaurants fetch failed:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}