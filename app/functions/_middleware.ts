// Server-side gate for internal-only pages, enforced at Cloudflare's edge.
// Unauthenticated requests are redirected to /login before any protected
// file (page, script, or /api/* data) is served — the content never
// reaches a browser that hasn't supplied the shared password.
//
// Configure ACCESS_PASSWORD as an environment variable on the Cloudflare
// Pages project (Settings -> Environment variables, marked "Encrypt").
// Redeploy after changing it for the change to take effect.

import { verifySessionCookie } from './_lib/session';

interface Env {
  ACCESS_PASSWORD: string;
}

// Canonical (extensionless) protected paths. Cloudflare Pages serves the
// same file at both "/tools/team-wigs.html" and its clean-URL form
// "/tools/team-wigs" (redirecting between them), so requests are normalized
// before matching — otherwise the clean-URL form slips through unguarded.
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

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const pathname = normalizePath(url.pathname);

  if (matchesAny(pathname, PUBLIC_PATHS) || !matchesAny(pathname, PROTECTED_PATHS)) {
    return context.next();
  }

  const { ACCESS_PASSWORD } = context.env;
  if (!ACCESS_PASSWORD) {
    return new Response('Access is not configured for this deployment.', { status: 500 });
  }

  const authenticated = await verifySessionCookie(context.request.headers.get('Cookie'), ACCESS_PASSWORD);
  if (authenticated) {
    return context.next();
  }

  const next = encodeURIComponent(url.pathname + url.search);
  return Response.redirect(`${url.origin}/login?next=${next}`, 302);
};
