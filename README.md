# San3a Academy Toolkit

Internal tools dashboard and course tools for the San3a Academy team: live course scheduling, performance dashboards, a shared whiteboard for online sessions, course-specific tools, and small utilities.

The whole site is one **Cloudflare Worker** with static assets. There is no separate server to run: the Worker serves the pages, handles login, proxies Google Sheets data and hosts the whiteboard's realtime sync.

---

## What's in it

### Dashboard and courses (React app)
| Page | URL | Notes |
| :--- | :--- | :--- |
| Dashboard | `/` | Password protected |
| Course library | `/courses` | |
| Code & Create | `/courses/code-create` | Project journal, challenge wall, student portfolio |
| Debugging Fundamentals | `/courses/debugging` | Wizard, flowchart, system map, developer editor (client-side `PasswordGate`) |
| Employability | `/courses/employability` | Pre-course onboarding, PCB Design and Manufacturing |

### Course tools
- **Pre-Course Onboarding**: `/employability/pre-course.html` (also `/onboarding`). Staff link generator and learner onboarding portal. Public.
- **PCB Design and Manufacturing**: `/employability/pcb-design-and-manufacturing/`. San3a PCB fabrication kit: Gerber to 1000 DPI PNG, PNG to G-code (Mods), student guide. Runs fully in the browser. Public. See [PCB fabrication kit](#pcb-fabrication-kit).
- **Code & Create**: `/code-create/*.html`. The student portfolio reads its sheet through `/api/csv/portfolio`.

### General tools
- **Online Whiteboard**: `/whiteboard/`. Shared live board for online sessions. See [Whiteboard](#whiteboard).
- **Crash Courses Calendar**: `/calendar/`. Live schedule from Google Sheets with vacation/clash shifting. Password protected.
- **Team & Individual WIGs**: `/tools/team-wigs.html`, `/tools/individual-wigs.html`. Password protected.
- **QR Generator** and **Video to GIF**: `/tools/qr-generator.html`, `/tools/video-to-gif.html`. Run in the browser.

---

## Project structure

```text
San3aTech_Tool-kit/
├── README.md
├── PROJECT_STRUCTURE.md
├── docs/media-kit/                 # Brand logos and assets
└── app/                            # Everything that gets deployed
    ├── src/                        # React dashboard + course pages (Vite, TypeScript, Tailwind)
    │   ├── App.tsx                 # Routes and sidebar
    │   └── pages/                  # Dashboard.tsx, CoursesHub.tsx (course tool cards), debugging pages
    ├── public/                     # Static pages, copied as-is into the build
    │   ├── calendar/  code-create/  tools/  onboarding/  whiteboard/
    │   └── employability/
    │       ├── pre-course.html
    │       └── pcb-design-and-manufacturing/   # BUILT PCB kit (generated, do not edit by hand)
    ├── tools-src/
    │   └── PCB Design and Manufacturing/       # PCB kit source (not deployed)
    │       ├── san3a-pcb-fabrication-kit/      # The kit app (Vite + React)
    │       ├── Gerber-2-PNG/  mods-mill-2d-pcb/  media-kit/   # Original projects/assets, for reference
    ├── scripts/build-pcb-kit.mjs   # Builds the kit into public/
    ├── worker/                     # Cloudflare Worker
    │   ├── index.ts                # Routing, login gate, HTML runtime config
    │   ├── session.ts              # Signed session cookie
    │   ├── csv.ts                  # Google Sheets CSV proxy
    │   └── whiteboard.ts           # Whiteboard Durable Object (realtime + storage)
    ├── wrangler.jsonc              # Worker config, vars, Durable Object binding
    └── vite.config.ts              # Vite + PWA config
```

---

## Running locally

Requirements: Node.js 20.19+ (22 or newer recommended).

```bash
cd app
npm install
cp .dev.vars.example .dev.vars    # then fill in the values
```

| Command | What it does |
| :--- | :--- |
| `npm run dev` | Vite dev server for the React app and static pages. **No Worker**: no login, no `/api/*`, no whiteboard sync. |
| `npm run worker:dev` | Builds the app and runs the real Worker locally with Wrangler (login, CSV proxy, whiteboard). Use this to test before deploying. |
| `npm run build` | Production build into `app/dist/`. |
| `npm run build:pcb` | Rebuilds the PCB kit into `public/employability/pcb-design-and-manufacturing/`. |
| `npm run lint` | ESLint for the React/TypeScript code. |

---

## Deploying (Cloudflare)

```bash
cd app
npm run build
npx wrangler deploy
```

`wrangler deploy` uploads the Worker and `dist/` and creates the whiteboard Durable Object on first deploy (migration `v1-whiteboard` in `wrangler.jsonc`).

### Configuration
Set these in the Cloudflare dashboard under the Worker's **Settings → Variables and Secrets**, and in `app/.dev.vars` for local runs:

| Variable | Purpose |
| :--- | :--- |
| `ACCESS_PASSWORD` (secret) | Shared password for the protected pages. Changing it signs everyone out. |
| `TEAM_WIGS_CSV_URL`, `INDIVIDUAL_WIGS_CSV_URL` | Published Google Sheet CSV links for the WIGs dashboards |
| `PORTFOLIO_CSV_URL` | Student projects portfolio sheet |
| `VACATIONS_CSV_URL`, `SCHEDULER_CSV_URL`, `AVAILABILITY_CSV_URL` | Calendar sheets |

Public onboarding links (Discord invite, survey forms, etc.) are plain `vars` in `wrangler.jsonc`.

### Access control
- `app/worker/index.ts` checks a signed session cookie before serving `/`, `/calendar`, the WIGs pages and `/api/*`. Without it, visitors are sent to `/login`.
- Public paths (no password): `/login`, `/onboarding`, `/employability/*` (including the PCB kit), `/whiteboard`, `/api/whiteboard`, `/api/csv/portfolio`, static assets.
- The sheet URLs never reach the browser: pages fetch `/api/csv/<name>` and the Worker fetches the sheet.

### Service worker (PWA)
The React app is installable and cached offline. Only React routes (`/` and `/courses/*`) fall back to the cached app shell. Every other page loads from the network. The PCB kit is not precached. If you add a new React route outside `/courses`, add it to `navigateFallbackAllowlist` in `app/vite.config.ts`.

---

## Whiteboard

- The instructor opens `/whiteboard/`, clicks **Create a new board**, then **Share** to copy the student link (`/whiteboard/?room=<id>`).
- Everything drawn appears live for everyone. Students are **view only** by default. The **Students: view only / can draw** toggle changes that for all students at once, and the server enforces it.
- Boards are saved in a Durable Object (`worker/whiteboard.ts`), so late joiners and refreshes see the full board.
- Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z (or Ctrl+Y) undo and redo each person's own last 50 actions, even after a refresh. **Clear** is instructor only and can be undone.
- The instructor is whoever holds the board's secret key, which is saved in the browser that created it. The Share dialog has a private instructor link for opening the board on another device.
- Boards nobody opens for 30 days are deleted.
- Local testing needs `npm run worker:dev`.

---

## PCB fabrication kit

The kit is a separate Vite app made by the San3a team, kept as-is in `app/tools-src/PCB Design and Manufacturing/san3a-pcb-fabrication-kit/` (see its own README for how it works and the credits). The toolkit deploys only its built output.

**To update the kit:**
1. Change the code in `app/tools-src/PCB Design and Manufacturing/san3a-pcb-fabrication-kit/`.
2. From `app/`, run `npm run build:pcb`. It installs the kit's dependencies if needed and builds it with relative paths into `app/public/employability/pcb-design-and-manufacturing/`.
3. Commit the source changes **and** the regenerated files in `public/employability/pcb-design-and-manufacturing/`, then deploy as usual.

Notes:
- Never put the kit's source or `node_modules` under `app/public/`. Everything there is uploaded, and Cloudflare rejects large deploys (max 20,000 files, 25 MiB per file).
- The kit uses `#` routes (`#/guide`, `#/gerber`), so it works under any folder.
- The Mods files keep their original names, some with spaces. Don't rename them.
- The card on the Employability page is defined in `app/src/pages/CoursesHub.tsx`.

---

## Adding a new tool

- **Static page**: put it in `app/public/` (for example `app/public/tools/my-tool.html`).
- **General tool**: add a link in the sidebar (`app/src/App.tsx`) and a card in `app/src/pages/Dashboard.tsx`.
- **Course tool**: add an entry to that course's `tools` list in `app/src/pages/CoursesHub.tsx`.
- **Separate app with its own build**: keep the source in `app/tools-src/` and build its output into `app/public/`, like the PCB kit.
- **Password protection**: add the path to `PROTECTED_PATHS` in `app/worker/index.ts`.

---

## Tech stack
- **Dashboard**: React 19, TypeScript, Vite, Tailwind CSS, vite-plugin-pwa
- **Static tools**: HTML, vanilla JavaScript, CSS
- **Backend**: Cloudflare Workers, Durable Objects (SQLite storage, WebSockets)
- **Data**: Google Sheets published CSV, proxied by the Worker
- **PCB kit**: React 18, Vite, Tailwind, pcb-stackup, Mods (MIT CBA / mods CE)

**Maintainer**: San3a Academy Engineering Team
