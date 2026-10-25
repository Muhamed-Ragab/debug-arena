import { ImageResponse } from "next/og";
import { SocialCard } from "@/lib/seo/social-card";

export const alt = "Debug Arena - Master Software Debugging";
export const size = {
  height: 630,
  width: 1200,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(<SocialCard />, {
    ...size,
  });
}
