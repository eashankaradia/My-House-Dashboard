/**
 * Username → internal email mapping.
 *
 * Supabase Auth identifies users by email, so we present a friendly username in
 * the UI and transparently convert it to a stable internal email address. The
 * shared account must be created in the Supabase dashboard using the SAME
 * internal email (e.g. username "eashan" → email "eashan@myhouse.local").
 */
export const USERNAME_EMAIL_DOMAIN = "myhouse.local";

export function usernameToEmail(username: string): string {
  const clean = username.trim().toLowerCase().replace(/\s+/g, "");
  return `${clean}@${USERNAME_EMAIL_DOMAIN}`;
}
