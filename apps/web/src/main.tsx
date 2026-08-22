import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./contexts/ThemeContext";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { dynamicActivate } from "./i18n";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

function RootApp() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const init = async () => {
      const saved = localStorage.getItem("app-lang") || "en";
      await dynamicActivate(saved);
      setLoaded(true);
    };
    init();
  }, []);

  if (!loaded) return null;

  return (
    <I18nProvider i18n={i18n}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </I18nProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <RootApp />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
