import { readFile } from "node:fs/promises";
import { chromium } from "playwright";

const DEFAULT_BASE_URL = "http://localhost:3000";
const DEFAULT_VIEWPORT = { width: 390, height: 844 };
const ROUTES = ["/", "/catalogo", "/nutricion/registro"];

async function main() {
  const baseUrl = process.env.VALIDATE_BASE_URL ?? DEFAULT_BASE_URL;
  const env = await readLocalEnv();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: DEFAULT_VIEWPORT });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  try {
    await ensureServer(page, baseUrl);
    await authenticate(page, baseUrl, env);
    const routes = await validateRoutes(page, baseUrl);

    const failures = routes.filter((route) => route.overflow || route.finalUrl.includes("/auth/login"));

    if (consoleErrors.length > 0) {
      failures.push({ path: "console", reason: `${consoleErrors.length} console error(s)` });
    }

    console.log(JSON.stringify({ baseUrl, viewport: DEFAULT_VIEWPORT, routes, consoleErrors }, null, 2));

    if (failures.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
}

async function readLocalEnv() {
  const raw = await readFile(".env.local", "utf8");
  const env = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    env[key] = value;
  }

  for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "EMAIL"]) {
    if (!env[key]) {
      throw new Error(`Missing ${key} in .env.local`);
    }
  }

  return env;
}

async function ensureServer(page, baseUrl) {
  try {
    const response = await page.goto(`${baseUrl}/auth/login`, { waitUntil: "networkidle", timeout: 10_000 });
    if (!response || response.status() >= 500) {
      throw new Error(`Unexpected status ${response?.status() ?? "unknown"}`);
    }
  } catch (error) {
    throw new Error(`Local server is not reachable at ${baseUrl}. Start it with pnpm dev or pnpm start. ${error.message}`);
  }
}

async function authenticate(page, baseUrl, env) {
  const otp = await generateOtp(env);
  const result = await page.evaluate(
    async ({ email, token }) => {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, token }),
      });

      return { status: response.status, data: await response.json().catch(() => ({})) };
    },
    { email: env.EMAIL, token: otp },
  );

  if (result.status !== 200) {
    throw new Error(`OTP verification failed with status ${result.status}: ${JSON.stringify(result.data)}`);
  }

  await page.goto(baseUrl, { waitUntil: "networkidle" });
}

async function generateOtp(env) {
  const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ type: "magiclink", email: env.EMAIL }),
  });

  const data = await response.json();

  if (!response.ok || !data.email_otp) {
    throw new Error(`Could not generate OTP: ${JSON.stringify({ status: response.status, error: data.error })}`);
  }

  return data.email_otp;
}

async function validateRoutes(page, baseUrl) {
  const routes = [];

  for (const path of ROUTES.slice(0, 2)) {
    routes.push(await validateRoute(page, baseUrl, path));
  }

  const routineDetailPath = await page.evaluate(() => {
    const link = Array.from(document.links).find((anchor) => anchor.pathname.startsWith("/catalogo/rutinas/"));
    return link ? `${link.pathname}${link.search}` : null;
  });

  if (routineDetailPath) {
    routes.push(await validateRoute(page, baseUrl, routineDetailPath));
  }

  for (const path of ROUTES.slice(2)) {
    routes.push(await validateRoute(page, baseUrl, path));
  }

  return routes;
}

async function validateRoute(page, baseUrl, path) {
  await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle", timeout: 20_000 });
  await page.waitForTimeout(500);

  return page.evaluate((expectedPath) => {
    const width = window.innerWidth;
    const scrollWidth = document.documentElement.scrollWidth;

    return {
      path: expectedPath,
      finalUrl: location.href,
      overflow: scrollWidth > width,
      width,
      scrollWidth,
      title: document.title,
    };
  }, path);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
