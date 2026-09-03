// Proxies the internal Google Sheet "publish to web" CSV links server-side,
// so the actual sheet URLs never appear in any file the browser downloads.
// Without this, anyone who found the URL in the page source could read the
// sheet directly, bypassing the site entirely (and its Basic Auth gate).

interface Env {
  TEAM_WIGS_CSV_URL: string;
  INDIVIDUAL_WIGS_CSV_URL: string;
  PORTFOLIO_CSV_URL: string;
  VACATIONS_CSV_URL: string;
  SCHEDULER_CSV_URL: string;
  AVAILABILITY_CSV_URL: string;
}

const SHEET_ENV_KEYS: Record<string, keyof Env> = {
  'team-wigs': 'TEAM_WIGS_CSV_URL',
  'individual-wigs': 'INDIVIDUAL_WIGS_CSV_URL',
  portfolio: 'PORTFOLIO_CSV_URL',
  vacations: 'VACATIONS_CSV_URL',
  scheduler: 'SCHEDULER_CSV_URL',
  availability: 'AVAILABILITY_CSV_URL',
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const name = context.params.name;
  const key = typeof name === 'string' ? SHEET_ENV_KEYS[name] : undefined;
  if (!key) {
    return new Response('Unknown sheet.', { status: 404 });
  }

  const sheetUrl = context.env[key];
  if (!sheetUrl) {
    return new Response(`Sheet URL not configured for "${name}". Set ${key} in the Pages project environment variables.`, {
      status: 500,
    });
  }

  const upstream = await fetch(sheetUrl);
  if (!upstream.ok) {
    return new Response('Failed to fetch sheet data.', { status: 502 });
  }

  const body = await upstream.text();
  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Cache-Control': 'private, max-age=30',
    },
  });
};
