export interface OAuthCredentials {
  clientId: string;
  clientSecret: string;
}

/**
 * Builds the better-auth socialProviders config from process env.
 * Providers are only enabled when BOTH their env vars are present so the
 * API boots cleanly in dev without OAuth credentials configured.
 */
export function buildSocialProviders(env: NodeJS.ProcessEnv): Record<string, OAuthCredentials> {
  const providers: Record<string, OAuthCredentials> = {};
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.google = {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    };
  }
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
    providers.github = {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    };
  }
  return providers;
}
