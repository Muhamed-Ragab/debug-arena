/**
 * Determines whether consent has been granted to store the
 * `better-auth.last_used_login_method` cookie (non-essential, GDPR).
 *
 * Future banner writes `app_consent=granted` or `last_login_consent=1`.
 * Absent cookie header is treated as no consent (fail-closed).
 */
export function hasConsentForLastLogin(cookieHeader: string): boolean {
  if (!cookieHeader) {
    return false;
  }
  return (
    /(?:^|;\s*)(?:app_consent|consent)=granted(?:\s*;|$)/.test(cookieHeader) ||
    /(?:^|;\s*)last_login_consent=1(?:\s*;|$)/.test(cookieHeader)
  );
}
