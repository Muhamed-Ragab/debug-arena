import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (
    !(
      locale &&
      routing.locales.includes(locale as (typeof routing.locales)[number])
    )
  ) {
    locale = routing.defaultLocale;
  }

  try {
    const messages = (await import(`../../messages/${locale}.po`)).default;
    return { locale, messages };
  } catch {
    const messages = (await import("../../messages/en.po")).default;
    return { locale: routing.defaultLocale, messages };
  }
});
