// The actual Worker fetch handler for this site. This project deploys via
// `wrangler deploy` to a Cloudflare Worker with a static-assets binding
// (not Cloudflare Pages), so all auth + API logic has to live in one script
// here rather than in a `functions/` directory (that's a Pages-only
// convention and is never executed under a plain Worker deployment).
//
// Configure ACCESS_PASSWORD and the *_CSV_URL
// variables under this Worker's Settings -> Variables and Secrets in the
// Cloudflare dashboard (mark ACCESS_PASSWORD "Encrypt"). Redeploy after
// changing any of them.

import { verifySessionCookie, createSessionCookie, clearSessionCookie, timingSafeEqual } from './session';
import { proxyCsv, type CsvEnv } from './csv';

interface Env extends CsvEnv {
  ASSETS: Fetcher;
  ACCESS_PASSWORD: string;
  EMPLOYABILITY_ONBOARDING_URL?: string;
  PERSONAL_INFO_URL?: string;
  DISCORD_INVITE_URL?: string;
  PHYSICA_AI_SURVEY_URL?: string;
  PHYSICA_AI_LAPTOP_URL?: string;
  PHYSICA_AI_VIDEO_URL?: string;
  ESP32_SURVEY_URL?: string;
  IOT_EXPLORERS_SURVEY_URL?: string;
}

// Canonical (extensionless) protected paths. The assets binding serves the
// same file at both "/tools/team-wigs.html" and its clean-URL form
// "/tools/team-wigs", so requests are normalized before matching.
const PROTECTED_PATHS = ['/calendar', '/tools/team-wigs', '/tools/individual-wigs', '/api'];

const PUBLIC_PATHS = [
  '/login',
  '/api/login',
  '/api/logout',
  '/api/csv/portfolio',
  '/onboarding',
  '/employability',
  '/tools/employability-onboarding',
  '/images',
  '/assets',
  '/styles',
  '/scripts'
];

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

async function serveAsset(request: Request, env: Env): Promise<Response> {
  const response = await env.ASSETS.fetch(request);
  const contentType = response.headers.get('Content-Type') ?? '';

  if (!contentType.includes('text/html')) {
    return response;
  }

  const html = await response.text();
  const onboardingData = {
    C: {
      "physica-ai": "Physical AI for Beginners",
      esp32: "ESP32 Hybrid Course",
      "iot-explorers": "IoT Explorers Bootcamp"
    },
    p: env.PERSONAL_INFO_URL || "https://forms.gle/A1dnvCoEBc4X7q2d6",
    d: env.DISCORD_INVITE_URL || "https://discord.gg/CcNAasJN4",
    s: {
      "physica-ai": env.PHYSICA_AI_SURVEY_URL || "https://forms.gle/VTrmZbxc2ptfahwD9",
      esp32: env.ESP32_SURVEY_URL || "https://forms.gle/3UrLWTDeTE6HTvMT7",
      "iot-explorers": env.IOT_EXPLORERS_SURVEY_URL || "https://forms.gle/Qy4XAi4MRZnaDRTH8"
    },
    laptop: env.PHYSICA_AI_LAPTOP_URL || "https://docs.google.com/document/d/1_XWsdEeVYVl1uu7e-oMrSMDstDrw_LequzNFE6F3SOU/edit?usp=sharing",
    video: env.PHYSICA_AI_VIDEO_URL || "https://drive.google.com/file/d/1LOxpHa_hdLkGTN3Yr4UyFORZ4-5aId2I/view?usp=sharing"
  };

  const runtimeConfig = `window.__SAN3A_CONFIG__ = ${JSON.stringify({
    EMPLOYABILITY_ONBOARDING_URL: env.EMPLOYABILITY_ONBOARDING_URL ?? '',
    ONBOARDING_DATA: onboardingData
  })};`;
  const headers = new Headers(response.headers);
  headers.delete('Content-Length');
  headers.delete('ETag');

  return new Response(html.replace('<!-- RUNTIME_CONFIG -->', `<script>${runtimeConfig}</script>`), {
    status: response.status,
    statusText: response.statusText,
    headers
  });
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

    if (pathname === '/onboarding' || pathname === '/employability/onboarding') {
      const assetUrl = new URL(request.url);
      assetUrl.pathname = '/employability/pre-course.html';
      return serveAsset(new Request(assetUrl.toString(), request), env);
    }

    const isRoot = pathname === '' || pathname === '/';
    const isProtected = isRoot || matchesAny(pathname, PROTECTED_PATHS);
    const isPublic = matchesAny(pathname, PUBLIC_PATHS);

    if (isProtected && !isPublic) {
      if (env.ACCESS_PASSWORD) {
        const authenticated = await verifySessionCookie(request.headers.get('Cookie'), env.ACCESS_PASSWORD);
        if (!authenticated) {
          const next = encodeURIComponent(url.pathname + url.search);
          return Response.redirect(`${url.origin}/login?next=${next}`, 302);
        }
      }
    }

    if (pathname.startsWith('/api/csv/')) {
      const name = pathname.slice('/api/csv/'.length);
      return proxyCsv(name, env);
    }

    return serveAsset(request, env);
  },
} satisfies ExportedHandler<Env>;
