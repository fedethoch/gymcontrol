const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE = "http://localhost:3000";
const EMAIL = "gymcontrolweb@gmail.com";
const OTP = process.argv[2] || "000000";
const OUT_DIR = path.join(__dirname, "..", ".playwright-cli");

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();

  // Authenticate via verify-otp API
  await page.goto(`${BASE}/auth/login`);
  await page.waitForLoadState("networkidle");

  const authResult = await page.evaluate(
    async ({ email, otp }) => {
      const resp = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, token: otp }),
      });
      const data = await resp.json().catch(() => ({}));
      return { status: resp.status, data };
    },
    { email: EMAIL, otp: OTP },
  );

  console.log("Auth result:", JSON.stringify(authResult));

  if (authResult.status !== 200) {
    console.error("Auth failed:", authResult.data);
    await browser.close();
    process.exit(1);
  }

  // Navigate to the redirect destination to trigger cookie use
  await page.goto(`${BASE}${authResult.data.redirectTo || "/"}`, { waitUntil: "networkidle" });

  // Screenshot each target page
  const pages = [
    { url: "/", name: "home" },
    { url: "/dashboard", name: "dashboard" },
    { url: "/dashboard/rutinas/dia?savedRoutineId=4292766a-1eba-4ed0-8df2-d028a08905d1&day=1", name: "rutinas-dia" },
    { url: "/nutricion/registro", name: "nutricion-registro" },
    { url: "/admin", name: "admin" },
  ];

  for (const { url, name } of pages) {
    await page.goto(`${BASE}${url}`, { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(1500);
    const file = path.join(OUT_DIR, `screenshot-${name}.png`);
    await page.screenshot({ path: file, fullPage: false });
    console.log(`Screenshot: ${file}`);
  }

  await browser.close();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
