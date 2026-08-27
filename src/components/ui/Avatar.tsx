import { cn } from "@/lib/utils";

interface AvatarProps {
  className?: string;
  color?: string;
  image?: string | null;
  name?: string | null;
  preferredColor?: string;
  size?: number;
}

export function Avatar({
  name,
  image,
  color,
  preferredColor,
  size = 30,
  className,
}: AvatarProps) {
  const safeName = name?.trim() || "User";
  const initials = safeName
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const customColor = preferredColor || color;

  if (image) {
    return (
      <div
        className={cn(
          "relative flex-shrink-0 select-none overflow-hidden rounded-full border border-border/40",
          className
        )}
        style={{ height: size, width: size }}
      >
        {/* biome-ignore lint/performance/noImgElement: dynamic external avatar url */}
        <img
          alt={safeName}
          className="h-full w-full object-cover"
          height={size}
          src={image}
          width={size}
        />
      </div>
    );
  }

  const bgStyle = customColor
    ? { backgroundColor: customColor, color: "#ffffff" }
    : {
        backgroundColor: "rgba(99,102,241,0.18)",
        color: "#818CF8",
      };

  return (
    <div
      className={cn(
        "flex flex-shrink-0 select-none items-center justify-center rounded-full font-semibold",
        className
      )}
      style={{
        ...bgStyle,
        fontSize: Math.max(10, Math.round(size * 0.36)),
        height: size,
        width: size,
      }}
    >
      {initials}
    </div>
  );
}
