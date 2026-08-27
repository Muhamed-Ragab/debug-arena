export function RankMedal({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="font-mono font-semibold text-[#F5C842] text-sm tabular-nums">
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="font-mono font-semibold text-[#B0B8C8] text-sm tabular-nums">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="font-mono font-semibold text-[#C8845A] text-sm tabular-nums">
        3
      </span>
    );
  }
  return (
    <span className="font-mono text-sm text-zinc-600 tabular-nums">{rank}</span>
  );
}
