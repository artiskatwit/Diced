"use client";

interface BottomNavProps {
  activeTab: "feed" | "lists" | "map" | "leaderboard" | "profile";
  setActiveTab: (tab: "feed" | "lists" | "map" | "leaderboard" | "profile") => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-950/95 backdrop-blur-lg border-t border-slate-900 p-3 flex justify-around items-center text-[10px] font-semibold text-slate-400 z-20">
      <button
        onClick={() => setActiveTab("lists")}
        className={`flex flex-col items-center space-y-0.5 ${
          activeTab === "lists" ? "text-emerald-400" : "hover:text-slate-200"
        }`}
      >
        <span className="text-base">📋</span>
        <span>Lists</span>
      </button>
      <button
        onClick={() => setActiveTab("map")}
        className={`flex flex-col items-center space-y-0.5 ${
          activeTab === "map" ? "text-emerald-400" : "hover:text-slate-200"
        }`}
      >
        <span className="text-base">🗺️</span>
        <span>Map</span>
      </button>
      <button className="bg-emerald-500 text-slate-950 p-2.5 rounded-full font-black text-sm -mt-5 shadow-lg shadow-emerald-500/20">
        ＋
      </button>
      <button
        onClick={() => setActiveTab("leaderboard")}
        className={`flex flex-col items-center space-y-0.5 ${
          activeTab === "leaderboard" ? "text-emerald-400" : "hover:text-slate-200"
        }`}
      >
        <span className="text-base">🏆</span>
        <span>Leaderboard</span>
      </button>
      <button
        onClick={() => setActiveTab("profile")}
        className={`flex flex-col items-center space-y-0.5 ${
          activeTab === "profile" ? "text-emerald-400" : "hover:text-slate-200"
        }`}
      >
        <span className="text-base">👤</span>
        <span>Profile</span>
      </button>
    </nav>
  );
}