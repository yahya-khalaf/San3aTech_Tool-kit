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
      className="flex items-center justify-center h-full p-6 bg-brand-night"
    >
      <div className="w-full max-w-[420px] bg-white rounded-none shadow-2xl border border-gray-200 p-7">
        <img src="/brand/san3a-academy-logo.png" alt="San3a Academy" className="h-12 w-auto mb-5" />
        <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">Sign In</h2>
        <p className="text-sm text-gray-600 mb-5">{description}</p>
        <form onSubmit={handleSubmit} className="grid gap-3.5">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            required
            className="input"
          />
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary disabled:opacity-60"
          >
            Access {title}
          </button>
          {status && <p className="text-xs font-semibold text-[#B42318] min-h-[16px]">{status}</p>}
        </form>
      </div>
    </div>
  );
}
