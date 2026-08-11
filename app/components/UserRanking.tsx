interface UserRankingProps {
  rank: number;
  fitScore: number;
}

export default function UserRanking({ rank, fitScore }: UserRankingProps) {
  const label =
    fitScore === Infinity ? "No menu data" :
    fitScore < 0.3 ? "Great fit" :
    fitScore < 0.7 ? "Good fit" :
    "Loose fit";

  return (
    <div className="flex items-center space-x-1.5">
      <span className="w-6 h-6 bg-slate-800 text-emerald-400 rounded-full flex items-center justify-center font-bold text-xs border border-slate-700">
        #{rank}
      </span>
      <span className="text-[9px] text-slate-500 uppercase tracking-wide">{label}</span>
    </div>
  );
}