import { i18n } from "@lingui/core";

export const locales = {
  en: "English",
  ar: "العربية"
};

export async function dynamicActivate(locale: string) {
  const messages = await import(`./locales/${locale}.json`);
  i18n.load(locale, messages.default || messages);
  i18n.activate(locale);
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  localStorage.setItem("app-lang", locale);
}
