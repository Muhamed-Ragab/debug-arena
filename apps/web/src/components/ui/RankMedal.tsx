export function RankMedal({ rank }: { rank: number }) {
  if (rank === 1)
    return <span className="text-[#F5C842] font-mono font-semibold text-sm tabular-nums">1</span>;
  if (rank === 2)
    return <span className="text-[#B0B8C8] font-mono font-semibold text-sm tabular-nums">2</span>;
  if (rank === 3)
    return <span className="text-[#C8845A] font-mono font-semibold text-sm tabular-nums">3</span>;
  return <span className="text-zinc-600 font-mono text-sm tabular-nums">{rank}</span>;
}
