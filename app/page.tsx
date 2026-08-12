"use client";

import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import Auth from "./components/Auth";
import Onboarding from "./components/Onboarding";
import DicedDashboard from "./components/DicedDashboard";
import type { MacroTargets } from "./lib/targets";

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [userWeight, setUserWeight] = useState(180);
  const [userTargets, setUserTargets] = useState<MacroTargets>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCheckingSession(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Once we have a session, load their profile (targets + onboarding state)
  useEffect(() => {
    if (!session) {
      setLoadingProfile(false);
      return;
    }

    async function loadProfile() {
      setLoadingProfile(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (data) {
        setUserWeight(data.weight);
        setUserTargets({
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
        });
        setHasCompletedOnboarding(data.has_completed_onboarding);
      }
      // If no profile row exists yet, hasCompletedOnboarding stays false,
      // which routes them into Onboarding — the row gets created when they finish.

      setLoadingProfile(false);
    }

    loadProfile();
  }, [session]);

  async function saveProfile(weight: number, targets: MacroTargets, completedOnboarding: boolean) {
    if (!session) return;

    await supabase.from("profiles").upsert({
      id: session.user.id,
      weight,
      calories: targets.calories,
      protein: targets.protein,
      carbs: targets.carbs,
      fat: targets.fat,
      has_completed_onboarding: completedOnboarding,
    });
  }

  async function handleUpdateTargets(targets: MacroTargets) {
    setUserTargets(targets);
    await saveProfile(userWeight, targets, true);
  }

  if (checkingSession || (session && loadingProfile)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  if (!hasCompletedOnboarding) {
    return (
      <Onboarding
        onComplete={async (data) => {
          const targets: MacroTargets = {
            calories: data.targetCalories,
            protein: data.targetProtein,
            carbs: data.targetCarbs,
            fat: data.targetFat,
          };
          setUserWeight(data.weight);
          setUserTargets(targets);
          setHasCompletedOnboarding(true);
          await saveProfile(data.weight, targets, true);
        }}
      />
    );
  }

  return (
    <DicedDashboard
      userTargets={userTargets}
      userWeight={userWeight}
      onUpdateTargets={handleUpdateTargets}
      session={session}
    />
  );
}