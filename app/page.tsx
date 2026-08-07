"use client";

import { useState } from "react";
import Onboarding from "./components/Onboarding";
import DicedDashboard from "./components/DicedDashboard";

interface UserTargets {
  targetProtein: number;
  targetCalories: number;
}

export default function Home() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [userTargets, setUserTargets] = useState<UserTargets>({
    targetProtein: 0,
    targetCalories: 0,
  });

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