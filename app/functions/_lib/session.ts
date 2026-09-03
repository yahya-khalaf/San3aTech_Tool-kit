// Stateless signed session cookie for the shared-password gate. No KV/DB
// needed: the token is `<expiry>.<hmac>`, signed with a key derived from
// ACCESS_PASSWORD itself, so rotating the password also invalidates every
// existing session automatically.

export const SESSION_COOKIE_NAME = 'san3a_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  return crypto.subtle.importKey('raw', digest, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await hmacKey(secret);
  const signatureBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return base64UrlEncode(new Uint8Array(signatureBuf));
}

export function timingSafeEqual(a: string, b: string): boolean {
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

export async function createSessionCookie(password: string): Promise<string> {
  const expiry = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const payload = String(expiry);
  const signature = await sign(payload, password);
  const token = `${payload}.${signature}`;
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function verifySessionCookie(cookieHeader: string | null, password: string): Promise<boolean> {
  const token = readCookie(cookieHeader, SESSION_COOKIE_NAME);
  if (!token) return false;

  const separatorIndex = token.indexOf('.');
  if (separatorIndex === -1) return false;

  const payload = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);
  const expiry = Number(payload);
  if (!Number.isFinite(expiry) || expiry < Math.floor(Date.now() / 1000)) return false;

  const expectedSignature = await sign(payload, password);
  return timingSafeEqual(signature, expectedSignature);
}
