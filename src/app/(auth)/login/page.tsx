import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingFallback } from "@/components/shared/loading-fallback";
import { LoginPage } from "@/features/auth/LoginPage";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  description:
    "Sign in to your Debug Arena account to continue solving challenges, climbing the leaderboard, and mastering debugging.",
  path: "/login",
  title: "Sign In",
});

export default function Page() {
  return (
    <Suspense fallback={<LoadingFallback variant="page" />}>
      <LoginPage />
    </Suspense>
  );
}
