// The actual Worker fetch handler for this site. This project deploys via
// `wrangler deploy` to a Cloudflare Worker with a static-assets binding
// (not Cloudflare Pages), so all auth + API logic has to live in one script
// here rather than in a `functions/` directory (that's a Pages-only
// convention and is never executed under a plain Worker deployment).
//
// Configure ACCESS_PASSWORD and the *_CSV_URL variables under this Worker's
// Settings -> Variables and Secrets in the Cloudflare dashboard (mark
// ACCESS_PASSWORD "Encrypt"). Redeploy after changing any of them.

import { verifySessionCookie, createSessionCookie, clearSessionCookie, timingSafeEqual } from './session';
import { proxyCsv, type CsvEnv } from './csv';

interface Env extends CsvEnv {
  ASSETS: Fetcher;
  ACCESS_PASSWORD: string;
}

// Canonical (extensionless) protected paths. The assets binding serves the
// same file at both "/tools/team-wigs.html" and its clean-URL form
// "/tools/team-wigs", so requests are normalized before matching.
const PROTECTED_PATHS = ['/calendar', '/tools/team-wigs', '/tools/individual-wigs', '/code-create/student-projects-portfolio', '/api'];

const PUBLIC_PATHS = ['/login', '/api/login', '/api/logout'];

function normalizePath(pathname: string): string {
  let p = pathname;
  if (p.endsWith('/index.html')) {
    p = p.slice(0, -'index.html'.length);
  } else if (p.endsWith('.html')) {
    p = p.slice(0, -'.html'.length);
  }
  if (p.length > 1 && p.endsWith('/')) {
    p = p.slice(0, -1);
  }
  return p;
}

function matchesAny(pathname: string, list: string[]): boolean {
  return list.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function json(data: unknown, status: number, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

async function handleLogin(request: Request, env: Env): Promise<Response> {
  if (!env.ACCESS_PASSWORD) {
    return json({ error: 'Access is not configured for this deployment.' }, 500);
  }

  let password = '';
  try {
    const body = await request.json<{ password?: string }>();
    password = typeof body.password === 'string' ? body.password : '';
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  if (!password || !timingSafeEqual(password, env.ACCESS_PASSWORD)) {
    return json({ error: 'Incorrect password.' }, 401);
  }

  const cookie = await createSessionCookie(env.ACCESS_PASSWORD);
  return json({ ok: true }, 200, { 'Set-Cookie': cookie });
}

function handleLogout(): Response {
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie() });
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = normalizePath(url.pathname);

    if (pathname === '/api/login' && request.method === 'POST') {
      return handleLogin(request, env);
    }
    if (pathname === '/api/logout' && request.method === 'POST') {
      return handleLogout();
    }

    const isPublic = matchesAny(pathname, PUBLIC_PATHS);
    const isProtected = matchesAny(pathname, PROTECTED_PATHS);

    if (isProtected && !isPublic) {
      if (!env.ACCESS_PASSWORD) {
        return new Response('Access is not configured for this deployment.', { status: 500 });
      }
      const authenticated = await verifySessionCookie(request.headers.get('Cookie'), env.ACCESS_PASSWORD);
      if (!authenticated) {
        const next = encodeURIComponent(url.pathname + url.search);
        return Response.redirect(`${url.origin}/login?next=${next}`, 302);
      }
    }

    if (pathname.startsWith('/api/csv/')) {
      const name = pathname.slice('/api/csv/'.length);
      return proxyCsv(name, env);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
