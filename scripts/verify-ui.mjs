/**
 * Screenshots the key pages as a logged-in user, and fails on console errors.
 *
 * Needs a dev server running (`npm run dev`) and an environment that can
 * reach Supabase — see HANDOFF.md "Session setup". Credentials come from
 * TEST_LOGIN_USERNAME / TEST_LOGIN_PASSWORD.
 *
 *   npm run verify:ui                 # default routes
 *   npm run verify:ui -- /money /more # specific routes
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const USERNAME = process.env.TEST_LOGIN_USERNAME ?? "browser-verify";
const PASSWORD = process.env.TEST_LOGIN_PASSWORD;
const OUT = ".ui-screens";

// Playwright's bundled Chromium revision often differs from the one baked
// into the image, so point at the installed binary rather than downloading.
const EXECUTABLE = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome";

const DEFAULT_ROUTES = ["/dashboard", "/money", "/purchases", "/more", "/projects", "/shopping"];

if (!PASSWORD) {
  console.error("TEST_LOGIN_PASSWORD is not set. See HANDOFF.md 'Browser verification'.");
  process.exit(1);
}

const routes = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_ROUTES;

const browser = await chromium.launch({ executablePath: EXECUTABLE });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

/** Console errors and failed requests, tagged with the route that caused them. */
const problems = [];
let current = "startup";
page.on("console", (m) => {
  if (m.type() === "error") problems.push(`[${current}] console: ${m.text().slice(0, 200)}`);
});
page.on("pageerror", (e) => problems.push(`[${current}] pageerror: ${String(e).slice(0, 200)}`));
page.on("requestfailed", (r) => {
  // Aborted prefetches are routine in Next and not worth reporting.
  const why = r.failure()?.errorText ?? "";
  if (!why.includes("ABORTED")) problems.push(`[${current}] request failed: ${r.url().slice(0, 120)} ${why}`);
});

await mkdir(OUT, { recursive: true });

current = "login";
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill("#username", USERNAME);
await page.fill("#password", PASSWORD);
await page.click('button[type="submit"]');
await page.waitForURL(/\/dashboard/, { timeout: 30_000 }).catch(() => {});

if (new URL(page.url()).pathname.startsWith("/login")) {
  const toast = await page.locator("body").innerText();
  console.error("Sign-in failed. Page said:\n" + toast.slice(0, 500));
  await page.screenshot({ path: `${OUT}/login-failed.png` });
  await browser.close();
  process.exit(1);
}
console.log("signed in as", USERNAME);

for (const route of routes) {
  current = route;
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
  // Settle any client-side rendering before the shot.
  await page.waitForTimeout(600);
  const file = `${OUT}${route.replace(/\//g, "_") || "_root"}.png`;
  await page.screenshot({ path: file, fullPage: true });
  const heading = await page.locator("h1").first().innerText().catch(() => "(no h1)");
  console.log(`${route.padEnd(14)} -> ${file}  h1="${heading}"`);
}

await browser.close();

if (problems.length) {
  console.error(`\n${problems.length} problem(s) found:`);
  for (const p of problems) console.error("  " + p);
  process.exit(1);
}
console.log("\nNo console errors or failed requests.");
