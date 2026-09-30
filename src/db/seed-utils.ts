export function resolveAdminSeedPassword(
  configuredPassword: string | undefined
): string | null {
  const password = configuredPassword?.trim();
  if (!password || password === "Admin123456!") {
    return null;
  }
  return password;
}
