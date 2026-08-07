// app/api/nearby-restaurants/route.ts
import { NextResponse } from "next/server";

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
              radius: 1500.0, // meters, ~1 mile
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

    const restaurants = (data.places ?? []).map((place: any) => ({
      placeId: place.id,
      name: place.displayName?.text ?? "Unknown",
      address: place.formattedAddress,
      lat: place.location?.latitude,
      lng: place.location?.longitude,
      cuisine: place.primaryType ?? null,
      rating: place.rating ?? null,
    }));

    return NextResponse.json({ restaurants });
  } catch (err) {
    console.error("Nearby restaurants fetch failed:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}