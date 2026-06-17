async page => {
  const SUPABASE_URL = 'https://ignlzahslkkfucgnekkb.supabase.co';
  const ANON_KEY = 'sb_publishable_2voRVOit-FUr2OXxTFwyIg_7ifPbT_5';
  const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlnbmx6YWhzbGtrZnVjZ25la2tiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDMyMjcwNiwiZXhwIjoyMDk1ODk4NzA2fQ.U06N_hNiPKdyYosji4PSxiqbGavyhN3cXaKE0zC3RAg';

  // Get action_link from admin API
  const linkData = await page.evaluate(async ({ url, srk }) => {
    const res = await fetch(`${url}/auth/v1/admin/generate_link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${srk}`,
        'apikey': srk
      },
      body: JSON.stringify({
        type: 'magiclink',
        email: 'gymcontrolweb@gmail.com'
      })
    });
    const data = await res.json();
    return data.action_link || null;
  }, { url: SUPABASE_URL, srk: SERVICE_ROLE_KEY });

  if (!linkData) throw new Error('No action link generated');

  // Intercept the redirect to capture the code
  let capturedCode = null;
  await page.route('**', async (route) => {
    const reqUrl = route.request().url();
    const codeMatch = reqUrl.match(/[?&]code=([^&]+)/);
    if (codeMatch) {
      capturedCode = decodeURIComponent(codeMatch[1]);
      // Abort redirect, we have the code
      await route.abort();
    } else {
      await route.continue();
    }
  });

  // Navigate to action_link — will redirect with ?code=...
  try {
    await page.goto(linkData, { waitUntil: 'commit', timeout: 10000 });
  } catch (e) {
    // Expected: route abort causes navigation error
  }

  await page.unroute('**');

  if (!capturedCode) {
    // Fallback: check current URL
    const currentUrl = page.url();
    const codeMatch = currentUrl.match(/[?&]code=([^&]+)/);
    if (codeMatch) capturedCode = decodeURIComponent(codeMatch[1]);
  }

  if (!capturedCode) return 'No code captured. Current URL: ' + page.url();

  // Navigate to local callback with the code
  await page.goto(`http://localhost:3000/auth/callback?code=${encodeURIComponent(capturedCode)}`);
  await page.waitForTimeout(2000);
  return 'Final URL: ' + page.url();
}
