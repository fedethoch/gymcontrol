async page => {
  const ACCESS_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjRhMDcyZDZlLTk5NjQtNGY1ZC04ZWJkLTI2MGRjMDJhZTk2NyIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2lnbmx6YWhzbGtrZnVjZ25la2tiLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIyMWUyM2ZiNC1lNDk5LTRlOWUtODZiZC0zM2JjNzJiYWNkM2QiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzgxNjI1MzM0LCJpYXQiOjE3ODE2MjE3MzQsImVtYWlsIjoiZ3ltY29udHJvbHdlYkBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoiZ3ltY29udHJvbHdlYkBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiIyMWUyM2ZiNC1lNDk5LTRlOWUtODZiZC0zM2JjNzJiYWNkM2QifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJvdHAiLCJ0aW1lc3RhbXAiOjE3ODE2MjE3MzR9XSwic2Vzc2lvbl9pZCI6ImZmNzY2ODYwLWJhM2MtNGVkYS04NWI0LWIyZWEwMjQxNjA2ZCIsImlzX2Fub255bW91cyI6ZmFsc2V9.I_5hV6euRQDer-YL4P3q6tcwWs84butQzQ7SxAp1NZk3kHeV3XO62RyPsImhcJmcjRrc5yxIPjpXQopgESfJlw';
  const REFRESH_TOKEN = 'czzu5rrvorah';
  const SUPABASE_URL = 'https://ignlzahslkkfucgnekkb.supabase.co';
  const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlnbmx6YWhzbGtrZnVjZ25la2tiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDMyMjcwNiwiZXhwIjoyMDk1ODk4NzA2fQ.U06N_hNiPKdyYosji4PSxiqbGavyhN3cXaKE0zC3RAg';

  // Do everything in browser context (has btoa, TextEncoder, fetch)
  const result = await page.evaluate(async ({ url, srk, at, rt }) => {
    // Get user data
    const userRes = await fetch(`${url}/auth/v1/user`, {
      headers: { 'Authorization': `Bearer ${at}`, 'apikey': srk }
    });
    const userData = await userRes.json();

    const session = {
      access_token: at,
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: 1781625334,
      refresh_token: rt,
      user: userData
    };

    const sessionJson = JSON.stringify(session);
    // base64url encode (URL-safe)
    const base64 = btoa(unescape(encodeURIComponent(sessionJson)));
    const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    return { encoded: base64url, len: base64url.length };
  }, { url: SUPABASE_URL, srk: SERVICE_ROLE_KEY, at: ACCESS_TOKEN, rt: REFRESH_TOKEN });

  // Now set cookies in Node context using the encoded value
  const PROJECT_REF = 'ignlzahslkkfucgnekkb';
  const COOKIE_BASE = `sb-${PROJECT_REF}-auth-token`;
  const CHUNK_SIZE = 3180;
  const encoded = result.encoded;

  const cookies = [];
  if (encoded.length <= CHUNK_SIZE) {
    cookies.push({ name: COOKIE_BASE, value: `base64-${encoded}`, domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' });
  } else {
    const chunks = [];
    for (let i = 0; i < encoded.length; i += CHUNK_SIZE) chunks.push(encoded.slice(i, i + CHUNK_SIZE));
    chunks.forEach((chunk, idx) => {
      cookies.push({ name: `${COOKIE_BASE}.${idx}`, value: `base64-${chunk}`, domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' });
    });
  }

  await page.context().addCookies(cookies);
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(3000);
  return `Final URL: ${page.url()} | chunks: ${cookies.length}`;
}
