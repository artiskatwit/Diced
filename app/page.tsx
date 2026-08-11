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

  if (checkingSession) {
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
        onComplete={(data) => {
          setUserWeight(data.weight);
          setUserTargets({
            calories: data.targetCalories,
            protein: data.targetProtein,
            carbs: data.targetCarbs,
            fat: data.targetFat,
          });
          setHasCompletedOnboarding(true);
        }}
      />
    );
  }

  return (
    <DicedDashboard
      userTargets={userTargets}
      userWeight={userWeight}
      onUpdateTargets={setUserTargets}
      session={session}
    />
  );
}