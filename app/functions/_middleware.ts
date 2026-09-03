// Server-side gate for internal-only pages, enforced at Cloudflare's edge.
// The credentials never reach the browser unless they're correct, unlike the
// old client-side PasswordGate, which shipped its full content + password
// hash to everyone regardless of login state.
//
// Configure ACCESS_USERNAME and ACCESS_PASSWORD as environment variables on
// the Cloudflare Pages project (Settings -> Environment variables). Mark
// ACCESS_PASSWORD as "Encrypt" so it's stored as a secret. Redeploy after
// changing either value for it to take effect.

interface Env {
  ACCESS_USERNAME: string;
  ACCESS_PASSWORD: string;
}

const PROTECTED_PATHS = [
  '/calendar',
  '/tools/team-wigs.html',
  '/tools/individual-wigs.html',
  '/code-create/student-projects-portfolio.html',
  '/api',
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  const length = Math.max(aBytes.length, bBytes.length);
  let mismatch = aBytes.length === bBytes.length ? 0 : 1;
  for (let i = 0; i < length; i++) {
    mismatch |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return mismatch === 0;
}

function unauthorized(): Response {
  return new Response('Authentication required.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="San3a Academy Internal", charset="UTF-8"' },
  });
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  if (!isProtectedPath(url.pathname)) {
    return context.next();
  }

  const { ACCESS_USERNAME, ACCESS_PASSWORD } = context.env;
  if (!ACCESS_USERNAME || !ACCESS_PASSWORD) {
    return new Response('Access is not configured for this deployment.', { status: 500 });
  }

  const authHeader = context.request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return unauthorized();
  }

  let decoded: string;
  try {
    decoded = atob(authHeader.slice('Basic '.length));
  } catch {
    return unauthorized();
  }

  const separatorIndex = decoded.indexOf(':');
  if (separatorIndex === -1) {
    return unauthorized();
  }

  const user = decoded.slice(0, separatorIndex);
  const pass = decoded.slice(separatorIndex + 1);

  if (!timingSafeEqual(user, ACCESS_USERNAME) || !timingSafeEqual(pass, ACCESS_PASSWORD)) {
    return unauthorized();
  }

  return context.next();
};
