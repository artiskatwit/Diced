"use client";

import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import Auth from "./components/Auth";
import Onboarding from "./components/Onboarding";
import DicedDashboard from "./components/DicedDashboard";

interface UserTargets {
  targetProtein: number;
  targetCalories: number;
}

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [userTargets, setUserTargets] = useState<UserTargets>({
    targetProtein: 0,
    targetCalories: 0,
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
          setUserTargets({
            targetProtein: data.targetProtein,
            targetCalories: data.targetCalories,
          });
          setHasCompletedOnboarding(true);
        }}
      />
    );
  }

  return <DicedDashboard userTargets={userTargets} />;
}