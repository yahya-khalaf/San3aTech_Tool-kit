# 🏗️ San3a Academy Toolkit - Project Structure

This document provides a detailed breakdown of the internal architecture, design systems, and integration protocols for the San3a Academy Toolkit.

---

## 📁 Comprehensive File Structure

```text
San3aTech_Tool-kit/
├── index.html                    # Main Dashboard (Core Hub)
├── login.html                    # Internal Portal Authentication
├── auth.json                     # Encrypted-at-rest Credentials
├── PROJECT_STRUCTURE.md          # This file
├── README.md                     # Suite Overview & Setup
│
├── styles/                       # Global Design System
│   └── main.css                  # Core CSS variables, typography, and grid
├── scripts/                      # Core Logic
│   └── main.js                   # Dashboard interactions & sidebar logic
│
├── May calender/                 # [MODULE] Crash Courses Scheduler
│   ├── index.html                # Entry point (Auth protected)
│   ├── main.js                   # Logic: Live GSheets Sync + Clash Shifting
│   └── style.css                 # Module-specific styling
│
├── whiteboard/                   # [MODULE] Collaborative Whiteboard
│   ├── index.html                # Real-time canvas UI
│   ├── board.js                  # Drawing & Canvas engine
│   ├── realtime.js               # Web-socket/P2P sync logic
│   └── style.css                 # Dark-mode optimized UI
│
├── tools/                        # [UTILITIES] Standalone Web Tools
│   ├── qr-generator.html         # Custom QR engine with branding
│   ├── video-to-gif.html         # Client-side video processor
│   ├── team-wigs.html            # Performance Dashboard (Team)
│   └── individual-wigs.html      # Performance Dashboard (Individual)
│
└── images/                       # Global Assets
    └── San3a-Academy-logo.png    # Official Branding
```

---

## � Global Design System

The toolkit adheres to a unified design language to ensure a premium, integrated feel across all modules.

| Property | Value | Description |
| :--- | :--- | :--- |
| **Primary Color** | `#DC2626` | San3a Academy Signature Red |
| **Secondary Color** | `#111827` | Deep Charcoal for Sidebars/Headers |
| **Typography** | `Montserrat`, `Inter` | Professional sans-serif pairing |
| **Visual Effects** | Glassmorphism | Subtle backdrop-blur on cards and topbars |
| **Responsiveness** | Mobile-First | Fully liquid layout for tablet/mobile use |

---

## 🔐 Security & Access Control

Internal-only pages are gated server-side at the Cloudflare Pages edge, not in the browser:
1. **Enforcement**: `app/functions/_middleware.ts` runs on every request to `/calendar/*`, `/tools/team-wigs.html`, `/tools/individual-wigs.html`, and `/code-create/student-projects-portfolio.html`, and checks an HTTP Basic Auth header before Cloudflare serves any file. Unauthenticated requests never receive the page content.
2. **Credentials**: A single shared username/password, stored as encrypted environment variables (`ACCESS_USERNAME`, `ACCESS_PASSWORD`) on the Cloudflare Pages project — never shipped to the client. The admin can rotate the password from the Cloudflare dashboard without a code change (redeploy required to apply it).
3. **Debugging Fundamentals** (`/courses/debugging/*`) still uses the older client-side `PasswordGate` component, since that content lives inside the React app's bundle rather than as a separately-served static path. It's lower-sensitivity course material, not a security boundary.

---

## 🛠️ Tool Integration Patterns

To add a new tool to the suite, follow these standardized steps:

### 1. File Placement
- **Utility Tools**: Place single-file HTML utilities in the `/tools/` directory.
- **Complex Modules**: Create a dedicated subdirectory (like `/whiteboard/`) for multi-file tools.

### 2. Dashboard Registration
Add a new link to the sidebar in `index.html` and a corresponding `tool-card` in the `.tools-grid` section:
```html
<a href="your-tool.html" class="tool-card">
    <div class="tool-icon"> <!-- SVG Icon Here --> </div>
    <h3 class="tool-title">Tool Name</h3>
    <p class="tool-description">Brief description...</p>
</a>
```

### 3. Styling Consistency
Import the global variables from `styles/main.css` to maintain brand alignment:
```css
body { color: var(--text-color); background: var(--bg-color); }
.btn-primary { background: var(--san3a-red); }
```

---

**Version**: 1.2  
**Status**: Architecture Finalized ✅  
**Maintainer**: San3a Academy Engineering Team
