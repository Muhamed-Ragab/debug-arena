import { Suspense } from "react";
import { LoadingFallback } from "@/components/shared/loading-fallback";
import { LoginPage } from "@/features/auth/LoginPage";

export default function Page() {
  return (
    <Suspense fallback={<LoadingFallback variant="page" />}>
      <LoginPage />
    </Suspense>
  );
}
