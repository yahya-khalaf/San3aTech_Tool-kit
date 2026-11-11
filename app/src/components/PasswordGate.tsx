import { useEffect, useState, type FormEvent, type ReactNode } from 'react';

// Gate for client-side routes (Debugging Fundamentals). No password lives in
// the code: it uses the same shared-password session as the rest of the site.
// The Worker checks the password against the ACCESS_PASSWORD secret
// (POST /api/login) and reports the session state (GET /api/session).

type GateState = 'checking' | 'locked' | 'open';

export default function PasswordGate({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const [state, setState] = useState<GateState>('checking');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/session', { credentials: 'same-origin', cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { authenticated: false }))
      .then((data: { authenticated?: boolean }) => {
        if (!cancelled) setState(data.authenticated ? 'open' : 'locked');
      })
      .catch(() => {
        if (!cancelled) setState('locked');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'open') {
    return <>{children}</>;
  }

  if (state === 'checking') {
    return <div className="h-full" aria-busy="true" />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        setState('open');
        return;
      }
      const data = await res.json().catch(() => ({}));
      setStatus(data.error || 'Incorrect password. Please try again.');
    } catch {
      setStatus('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
      setPassword('');
    }
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
            disabled={submitting}
            className="rounded-xl px-4 py-3 text-white text-sm font-extrabold transition hover:-translate-y-0.5 disabled:opacity-60"
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
