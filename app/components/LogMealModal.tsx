"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import { combineScore, type LoggedMeal } from "../lib/ranking";

interface MenuItemLike {
  name: string;
  calories: number;
  protein: number;
  carbs?: number;
  fat?: number;
}

interface RestaurantOption {
  id: string;
  name: string;
  cuisine?: string;
  menuItems?: MenuItemLike[] | null;
}

interface LogMealModalProps {
  restaurants: RestaurantOption[];
  editingMeal?: LoggedMeal | null;
  onClose: () => void;
  onSave: (meal: LoggedMeal) => void;
}

type Step = "details" | "macro" | "taste" | "review";

export default function LogMealModal({
  restaurants,
  editingMeal,
  onClose,
  onSave,
}: LogMealModalProps) {
  const [step, setStep] = useState<Step>("details");

  const [restaurantId, setRestaurantId] = useState(editingMeal?.restaurantId ?? "");
  const [dishName, setDishName] = useState(editingMeal?.dishName ?? "");
  const [dishDescription, setDishDescription] = useState("");
  const [calories, setCalories] = useState(editingMeal?.calories?.toString() ?? "");
  const [protein, setProtein] = useState(editingMeal?.protein?.toString() ?? "");
  const [carbs, setCarbs] = useState(editingMeal?.carbs?.toString() ?? "");
  const [fat, setFat] = useState(editingMeal?.fat?.toString() ?? "");
  const [macroSource, setMacroSource] = useState<string | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(editingMeal?.photoUrl ?? null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [macroScore, setMacroScore] = useState(editingMeal?.macroScore ?? 5);
  const [tasteScore, setTasteScore] = useState(editingMeal?.tasteScore ?? 5);

  const selectedRestaurant = restaurants.find((r) => r.id === restaurantId);

  function handleMenuItemPick(item: MenuItemLike) {
    setDishName(item.name);
    setCalories(String(item.calories));
    setProtein(String(item.protein));
    setCarbs(item.carbs !== undefined ? String(item.carbs) : "");
    setFat(item.fat !== undefined ? String(item.fat) : "");
    setMacroSource("listed");
  }

  async function handleEstimateMacros() {
    if (!dishName) return;
    setEstimating(true);
    setEstimateError(null);

    try {
      const res = await fetch("/api/estimate-macros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dishes: [{
            name: dishName,
            description: dishDescription || undefined,
            restaurantName: selectedRestaurant?.name,
          }],
        }),
      });
      const data = await res.json();
      const result = data.dishes?.[0];

      if (!result || result.error) {
        setEstimateError("Couldn't estimate this dish — try adding a short description or enter macros manually.");
        setEstimating(false);
        return;
      }

      setCalories(String(result.calories));
      setProtein(String(result.protein));
      setCarbs(result.carbs !== undefined ? String(result.carbs) : "");
      setFat(result.fat !== undefined ? String(result.fat) : "");
      setMacroSource(result.source);
    } catch (err) {
      setEstimateError("Something went wrong estimating this dish.");
    }

    setEstimating(false);
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleEstimateFromPhoto() {
    if (!photoFile) return;
    setEstimating(true);
    setEstimateError(null);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(photoFile);
      });

      const res = await fetch("/api/estimate-macros-from-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: photoFile.type,
          restaurantName: selectedRestaurant?.name,
        }),
      });

      const result = await res.json();

      if (result.error) {
        setEstimateError("Couldn't estimate from photo — try typing the dish name instead.");
        setEstimating(false);
        return;
      }

      if (!dishName) setDishName(result.dishName);
      setCalories(String(result.calories));
      setProtein(String(result.protein));
      setCarbs(result.carbs !== undefined ? String(result.carbs) : "");
      setFat(result.fat !== undefined ? String(result.fat) : "");
      setMacroSource(result.source);
    } catch (err) {
      setEstimateError("Something went wrong estimating from the photo.");
    }

    setEstimating(false);
  }

  // Uploads the selected photo to Supabase Storage under the user's own
  // folder (required by our storage policy) and returns its public URL.
  async function uploadPhotoIfNeeded(): Promise<string | undefined> {
    if (!photoFile) return editingMeal?.photoUrl;

    setUploadingPhoto(true);

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      setUploadingPhoto(false);
      return undefined;
    }

    const fileExt = photoFile.name.split(".").pop() || "jpg";
    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("meal-photos")
      .upload(filePath, photoFile);

    setUploadingPhoto(false);

    if (uploadError) {
      console.error("Photo upload failed:", uploadError);
      return undefined;
    }

    const { data: urlData } = supabase.storage.from("meal-photos").getPublicUrl(filePath);
    return urlData.publicUrl;
  }

  async function handleSave() {
    if (!selectedRestaurant || !dishName) return;

    const photoUrl = await uploadPhotoIfNeeded();

    const meal: LoggedMeal = {
      id: editingMeal?.id ?? "",
      restaurantId: selectedRestaurant.id,
      restaurantName: selectedRestaurant.name,
      cuisine: selectedRestaurant.cuisine,
      dishName,
      calories: calories ? Number(calories) : undefined,
      protein: protein ? Number(protein) : undefined,
      carbs: carbs ? Number(carbs) : undefined,
      fat: fat ? Number(fat) : undefined,
      macroScore,
      tasteScore,
      combinedScore: combineScore(macroScore, tasteScore),
      photoUrl,
      createdAt: editingMeal?.createdAt ?? new Date().toISOString(),
    };

    onSave(meal);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center">
      <div className="bg-slate-950 border-t border-slate-800 rounded-t-3xl w-full max-w-md p-5 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-black text-emerald-400">
            {editingMeal ? "Edit Ranking" : "Log a Meal"}
          </h2>
          <button onClick={onClose} className="text-slate-500 text-sm">✕</button>
        </div>

        <div className="flex space-x-1.5">
          {(["details", "macro", "taste", "review"] as Step[]).map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${
                step === s ? "bg-emerald-500" : "bg-slate-800"
              }`}
            />
          ))}
        </div>

        {step === "details" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Restaurant</label>
              <select
                value={restaurantId}
                onChange={(e) => {
                  setRestaurantId(e.target.value);
                  setDishName("");
                  setDishDescription("");
                  setCalories("");
                  setProtein("");
                  setCarbs("");
                  setFat("");
                  setMacroSource(null);
                  setPhotoFile(null);
                  setPhotoPreview(null);
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200"
              >
                <option value="">Select a restaurant</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {selectedRestaurant?.menuItems && selectedRestaurant.menuItems.length > 0 && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">Known menu items</label>
                <div className="flex flex-wrap gap-2">
                  {selectedRestaurant.menuItems.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => handleMenuItemPick(item)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        dishName === item.name
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                          : "bg-slate-900 border-slate-800 text-slate-300"
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Don't see it? Type any dish name
              </label>
              <input
                type="text"
                value={dishName}
                onChange={(e) => {
                  setDishName(e.target.value);
                  setMacroSource(null);
                }}
                placeholder="e.g. The Firecracker Bowl"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200"
              />
              <input
                type="text"
                value={dishDescription}
                onChange={(e) => setDishDescription(e.target.value)}
                placeholder="Optional: what's in it? (helps accuracy)"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-400 mt-2"
              />

              <button
                type="button"
                onClick={handleEstimateMacros}
                disabled={!dishName || estimating}
                className="w-full mt-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 disabled:opacity-40 font-bold py-2.5 rounded-lg text-xs"
              >
                {estimating ? "Estimating..." : "✨ Get Macros From Name"}
              </button>

              <div className="mt-3 pt-3 border-t border-slate-800">
                <label className="text-xs text-slate-400 block mb-1">Or snap a photo of your meal</label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoSelect}
                  className="w-full text-xs text-slate-400 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-500/10 file:text-emerald-400 file:text-xs file:font-bold"
                />

                {photoPreview && (
                  <div className="mt-2 space-y-2">
                    <img src={photoPreview} alt="Meal preview" className="w-full h-32 object-cover rounded-lg" />
                    {photoFile && (
                      <button
                        type="button"
                        onClick={handleEstimateFromPhoto}
                        disabled={estimating}
                        className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 disabled:opacity-40 font-bold py-2.5 rounded-lg text-xs"
                      >
                        {estimating ? "Analyzing photo..." : "📸 Estimate From Photo"}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {estimateError && (
                <p className="text-[11px] text-red-400 mt-2">{estimateError}</p>
              )}

              {macroSource && !estimateError && (
                <p className="text-[10px] text-slate-500 mt-2">
                  {macroSource === "listed" && "From known menu data"}
                  {macroSource === "estimated_spoonacular" && "Estimated from nutrition database"}
                  {macroSource === "estimated_gemini" && "AI-estimated from dish description"}
                  {macroSource === "estimated_gemini_photo" && "AI-estimated from your photo"}
                </p>
              )}
            </div>

            {(calories || protein || carbs || fat) && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Macros {macroSource ? "(auto-filled — edit if needed)" : "(enter manually)"}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="Cal" className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200" />
                  <input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="Protein" className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200" />
                  <input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="Carbs" className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200" />
                  <input type="number" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="Fat" className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200" />
                </div>
              </div>
            )}

            {!calories && !protein && (
              <button
                type="button"
                onClick={() => setCalories("0")}
                className="text-[11px] text-slate-500 underline"
              >
                Skip macros, enter manually instead
              </button>
            )}

            <button
              type="button"
              onClick={() => setStep("macro")}
              disabled={!restaurantId || !dishName}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-black py-3 rounded-xl transition-colors text-sm uppercase tracking-wider"
            >
              Next: Macro Rating →
            </button>
          </div>
        )}

        {step === "macro" && (
          <div className="space-y-6">
            <div className="text-center py-4">
              <p className="text-slate-300 text-sm mb-1">How macro-friendly did this meal feel?</p>
              <p className="text-[11px] text-slate-500">1 = way off your goals, 10 = perfect fit</p>
            </div>

            <div className="text-center">
              <span className="text-4xl font-black text-emerald-400">{macroScore}</span>
              <span className="text-slate-500 text-sm">/10</span>
            </div>

            <input
              type="range"
              min={1}
              max={10}
              value={macroScore}
              onChange={(e) => setMacroScore(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setStep("details")}
                className="flex-1 bg-slate-900 border border-slate-800 text-slate-300 font-bold py-3 rounded-xl text-sm"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep("taste")}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-sm uppercase tracking-wider"
              >
                Next: Taste →
              </button>
            </div>
          </div>
        )}

        {step === "taste" && (
          <div className="space-y-6">
            <div className="text-center py-4">
              <p className="text-slate-300 text-sm mb-1">How did it taste?</p>
              <p className="text-[11px] text-slate-500">1 = not good, 10 = incredible</p>
            </div>

            <div className="text-center">
              <span className="text-4xl font-black text-emerald-400">{tasteScore}</span>
              <span className="text-slate-500 text-sm">/10</span>
            </div>

            <input
              type="range"
              min={1}
              max={10}
              value={tasteScore}
              onChange={(e) => setTasteScore(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setStep("macro")}
                className="flex-1 bg-slate-900 border border-slate-800 text-slate-300 font-bold py-3 rounded-xl text-sm"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep("review")}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-sm uppercase tracking-wider"
              >
                Next: Review →
              </button>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 space-y-3">
              {photoPreview && (
                <img src={photoPreview} alt="Meal" className="w-full h-40 object-cover rounded-lg" />
              )}
              <div>
                <p className="font-bold text-slate-100">{dishName}</p>
                <p className="text-xs text-slate-500">{selectedRestaurant?.name}</p>
              </div>

              {calories && (
                <p className="text-[11px] text-slate-500 font-mono">
                  {calories} kcal | {protein}g P | {carbs}g C | {fat}g F
                </p>
              )}

              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Macro fit</span>
                <span className="text-emerald-400 font-bold">{macroScore}/10</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Taste</span>
                <span className="text-emerald-400 font-bold">{tasteScore}/10</span>
              </div>
              <div className="flex justify-between text-sm border-t border-slate-800 pt-3">
                <span className="text-slate-300 font-bold">Overall Score</span>
                <span className="text-emerald-400 font-black text-lg">
                  {combineScore(macroScore, tasteScore)}/10
                </span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setStep("taste")}
                className="flex-1 bg-slate-900 border border-slate-800 text-slate-300 font-bold py-3 rounded-xl text-sm"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={uploadingPhoto}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-black py-3 rounded-xl text-sm uppercase tracking-wider"
              >
                {uploadingPhoto ? "Uploading photo..." : editingMeal ? "Save Changes" : "Save Ranking"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}