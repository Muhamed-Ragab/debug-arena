import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingFallback } from "@/components/shared/loading-fallback";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  description:
    "Create your Debug Arena account to practice diagnostic engineering, fix real-world bugs, and build your skill radar.",
  path: "/register",
  title: "Create an Account",
});

export default function Page() {
  return (
    <Suspense fallback={<LoadingFallback variant="page" />}>
      <RegisterPage />
    </Suspense>
  );
}
