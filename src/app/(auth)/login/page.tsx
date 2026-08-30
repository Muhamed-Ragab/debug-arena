import { Suspense } from "react";
import { LoginPage } from "@/features/auth/LoginPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
