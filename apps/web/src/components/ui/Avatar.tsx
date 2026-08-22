export function Avatar({ name, size = 30 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center font-semibold select-none flex-shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        backgroundColor: "rgba(99,102,241,0.18)",
        color: "#818CF8",
      }}
    >
      {initials}
    </div>
  );
}
