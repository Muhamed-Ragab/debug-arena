"use client";

import { useRouter } from "next/navigation";
import { ResultsScreen } from "./components/ResultsScreen";

export function ResultsPage() {
  const router = useRouter();
  return <ResultsScreen onNext={() => router.push("/challenges")} />;
}
