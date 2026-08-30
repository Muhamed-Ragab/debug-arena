import { Suspense } from "react";
import { LoadingFallback } from "@/components/shared/loading-fallback";
import { RegisterPage } from "@/features/auth/RegisterPage";

export default function Page() {
  return (
    <Suspense fallback={<LoadingFallback variant="page" />}>
      <RegisterPage />
    </Suspense>
  );
}
