/** The app's public origin — same value the auth/email flows already use for absolute URLs. */
export function getSiteUrl(): string {
  return process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
}
