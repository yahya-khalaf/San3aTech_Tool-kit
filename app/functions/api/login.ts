import { createSessionCookie, timingSafeEqual } from '../_lib/session';

interface Env {
  ACCESS_PASSWORD: string;
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { ACCESS_PASSWORD } = context.env;
  if (!ACCESS_PASSWORD) {
    return json({ error: 'Access is not configured for this deployment.' }, 500);
  }

  let password = '';
  try {
    const body = await context.request.json<{ password?: string }>();
    password = typeof body.password === 'string' ? body.password : '';
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  if (!password || !timingSafeEqual(password, ACCESS_PASSWORD)) {
    return json({ error: 'Incorrect password.' }, 401);
  }

  const cookie = await createSessionCookie(ACCESS_PASSWORD);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Set-Cookie': cookie },
  });
};
