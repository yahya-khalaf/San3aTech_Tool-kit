import { useEffect, useState, type FormEvent, type ReactNode } from 'react';

// Client-side only — used for the Debugging Fundamentals course pages,
// which don't carry sensitive data. Team WIGs, Individual WIGs, the Crash
// Courses Calendar, and the Student Projects Portfolio are gated server-side
// via HTTP Basic Auth at the Cloudflare Pages edge (see functions/_middleware.ts).
const PROTECTED_PASSWORD_HASH = '40d6ac2265d0a7dfee9ad07808259c9dd48f03e23584482ece151d10eba3fcda';

async function hashString(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function validatePassword(inputValue: string): Promise<boolean> {
  const normalized = inputValue.trim();
  if (!normalized) return false;
  const enteredHash = await hashString(normalized);
  return enteredHash === PROTECTED_PASSWORD_HASH;
}

export default function PasswordGate({
  sessionKey,
  title,
  description,
  children
}: {
  sessionKey: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    setAuthenticated(sessionStorage.getItem(sessionKey) === 'true');
  }, [sessionKey]);

  if (authenticated) {
    return <>{children}</>;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const isValid = await validatePassword(password);

    if (isValid) {
      sessionStorage.setItem(sessionKey, 'true');
      setStatus('');
      setAuthenticated(true);
      return;
    }

    setStatus('Incorrect password. Please try again.');
    setPassword('');
  };

  return (
    <div
      className="flex items-center justify-center h-full p-6"
      style={{ background: 'linear-gradient(135deg, rgba(36, 13, 24, 0.96), rgba(120, 22, 41, 0.94))' }}
    >
      <div className="w-full max-w-[420px] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-7">
        <h2 className="font-montserrat text-2xl font-bold text-gray-900 mb-2">Sign In</h2>
        <p className="text-sm text-gray-600 mb-5">{description}</p>
        <form onSubmit={handleSubmit} className="grid gap-3.5">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            required
            className="w-full px-3.5 py-3 rounded-xl border border-gray-200 bg-[#FFF7F3] text-gray-900 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
          <button
            type="submit"
            className="rounded-xl px-4 py-3 text-white text-sm font-extrabold transition hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #CF2027, #781629)' }}
          >
            Access {title}
          </button>
          {status && <p className="text-xs font-semibold text-primary min-h-[16px]">{status}</p>}
        </form>
      </div>
    </div>
  );
}
