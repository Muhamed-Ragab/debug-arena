"use client";

import { i18n } from "@lingui/core";
import { messages as enMessages } from "../locales/en/messages";
import { locales } from "./constants";

export type SupportedLocale = keyof typeof locales;

export { locales } from "./constants";

// Preload default English catalog synchronously
i18n.load("en", enMessages);
i18n.activate("en");

export async function dynamicActivate(locale: string): Promise<void> {
  const targetLocale = locale in locales ? locale : "en";
  if (targetLocale === "en") {
    i18n.load("en", enMessages);
    i18n.activate("en");
  } else if (targetLocale === "ar") {
    const { messages: arMessages } = await import("../locales/ar/messages");
    i18n.load("ar", arMessages);
    i18n.activate("ar");
  }

  if (typeof document !== "undefined") {
    document.documentElement.lang = targetLocale;
    document.documentElement.dir = targetLocale === "ar" ? "rtl" : "ltr";
    localStorage.setItem("app-lang", targetLocale);
  }
}
