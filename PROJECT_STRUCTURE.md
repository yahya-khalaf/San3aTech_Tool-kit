# San3a Academy Toolkit - Project Structure

## 📁 File Structure

```
San3aTech_Tool-kit/
├── index.html                    # Main dashboard page
├── login.html                    # Authentication page
├── auth.json                     # Hardcoded credentials (admin/password123)
├── tools/                        # Legacy tools (HTML/CSS/JS pairs)
│   ├── qr-generator.html        
│   ├── video-to-gif.html        
│   ├── team-wigs.html           
│   └── individual-wigs.html     
├── May calender/                  # Crash Courses Calendar module
│   ├── index.html                # Calendar entry (auth-protected)
│   ├── main.js                   # Calendar logic (Live sync + Shifting)
│   └── style.css                 # Premium Calendar UI
├── styles/                       # Toolkit-wide & Tool-specific styles
├── scripts/                      # Toolkit-wide & Tool-specific logic
└── README.md                     # Documentation & Setup guide
```

## 🔐 Authentication System

The toolkit uses a simple `localStorage` + `json` fetch system for internal access control.
- **Entry Point**: `login.html`
- **Mechanism**: Fetches `auth.json` to verify credentials.
- **Session**: Sets `san3a_auth: "true"` in `localStorage`.
- **Protection**: Each internal page (like the Calendar) has a `<script>` in the `<head>` that redirects to `login.html` if the session is missing.

## 🎯 Key Design Decisions

### ✅ Modular Calendar
The "May calender" is a standalone Vite/Vanilla project integrated as a subdirectory. This allows it to be updated or rewritten independently of the main dashboard.

### ✅ Live Data Sync (Calendar)
- Fetches data directly from Google Sheets via public CSV exports.
- **Vacation Awareness**: Sessions clashing with vacations are automatically shifted to the next available day.

### ✅ Dashboard Scalability
- The dashboard is structured to easily host many small internal tools.
- Each tool card on the homepage links directly to its tool or an intermediary login page.

## 🔧 How to Add a New Tool

1. **Create HTML file**: Usually in `tools/` or a dedicated subdirectory for complex tools.
2. **Update index.html**: Add a navigation link in the sidebar and a card in the `tools-grid`.
3. **Protect (Optional)**: If internal-only, link to `login.html` first or add the `san3a_auth` check script to your new page's head.

## 📦 Current Tools

1. **Crash Courses Calendar** (`May calender/index.html` - *Protected*)
   - Live schedule synced from Google Sheets.
   - Color-coded courses and room filters.
   - Intelligent holiday shifting.

2. **QR Code Generator** (`tools/qr-generator.html`)
   - Generate custom QR codes with branding.

3. **Video to GIF Converter** (`tools/video-to-gif.html`)
   - Fast, client-side video clipping and conversion.

4. **WIGs Dashboards** (`tools/team-wigs.html` & `tools/individual-wigs.html`)
   - Visual progress tracking for Academy goals.

## 🚀 Future Enhancements (Ideas)
- **Advanced Auth**: Shift from `auth.json` to a proper Firebase or JWT system.
- **Global Search**: A unified search across all dashboards and tools.
- **Mobile App**: PWA support for the calendar.

---

**Version**: 1.1  
**Last Updated**: Jan 2026  
**Status**: Integrated & Verified ✅
