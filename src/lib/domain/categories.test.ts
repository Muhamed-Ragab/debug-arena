import { Server } from "lucide-react";
import { describe, expect, it } from "vitest";
import { getCategoryAppearance } from "./categories";

describe("getCategoryAppearance", () => {
  it("uses color and icon metadata from an arbitrary database category", () => {
    const appearance = getCategoryAppearance({
      color: "#123456",
      icon: "Server",
      name: "Distributed Systems",
    });

    expect(appearance.color).toBe("#123456");
    expect(appearance.bg).toBe("color-mix(in srgb, #123456 12%, transparent)");
    expect(appearance.border).toBe(
      "color-mix(in srgb, #123456 28%, transparent)"
    );
    expect(appearance.Icon).toBe(Server);
  });
});
