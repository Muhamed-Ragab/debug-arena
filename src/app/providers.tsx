"use client";

import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { dynamicActivate } from "@/i18n/i18n";

function LocaleBootstrap({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const saved = localStorage.getItem("app-lang");
    if (saved === "ar") {
      dynamicActivate("ar");
    }
  }, []);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <I18nProvider i18n={i18n}>
          <LocaleBootstrap>{children}</LocaleBootstrap>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
