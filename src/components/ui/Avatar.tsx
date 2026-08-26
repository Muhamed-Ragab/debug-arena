export function Avatar({ name, size = 30 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className="flex flex-shrink-0 select-none items-center justify-center rounded-full font-semibold"
      style={{
        backgroundColor: "rgba(99,102,241,0.18)",
        color: "#818CF8",
        fontSize: size * 0.36,
        height: size,
        width: size,
      }}
    >
      {initials}
    </div>
  );
}
