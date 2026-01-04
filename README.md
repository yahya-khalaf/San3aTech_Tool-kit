# San3a Academy Toolkit

Internal tools dashboard for the San3a Academy team, featuring live utilities and scheduling management.

## 🎨 Design

- **Modern Dashboard UI** with sidebar navigation and tool-specific cards.
- **Vibrant Branding**: Uses San3a Academy's signature Red (#DC2626) with a premium, clean aesthetic.
- **Modular Architecture**: Supports standalone tool components like the integrated Calendar system.

## 🚀 Key Features

- **Crash Courses Calendar**:
  - Live data sync with Google Sheets (CSV).
  - **Dynamic Shifting**: Automatically moves sessions that clash with vacations to the next available slot.
  - **Organization**: Color-coded courses and room-based filtering.
- **Internal Authentication**: Secure access via `auth.json` to protect sensitive schedules.
- **Conversion Utilities**: Video to GIF converter and QR code generator.
- **Performance Tracking**: WIGs dashboards for both teams and individuals.

## 🛠️ Project Structure

```
San3aTech_Tool-kit/
├── index.html           # Main dashboard page
├── login.html           # Internal login portal
├── auth.json            # Credentials (admin/password123)
├── May calender/         # Live Calendar module
└── tools/               # Standard web tools
```

## 🎯 Developer Guide: Updating the Calendar

The "May calender" is built with Vanilla JS and pulls from public Google Sheets CSVs.

### To Update Sync Logic:
1. Open `May calender/main.js`.
2. Modify `processScheduler()` to add new column mappings or change how sessions are calculated.
3. The vacation shifting logic is handled within the main loop—it checks `isVacation()` before incrementing the session count.

### To Add New Tools:
1. Create your tool directory or file.
2. In `index.html`, add your tool to the `.tools-grid` section.
3. To protect the tool, wrap the link to `login.html` or add the session check script:
```javascript
if (localStorage.getItem('san3a_auth') !== 'true') window.location.href = '/login.html';
```

## 📦 Getting Started

1. **Deploy**: Host the root folder on any static web server (NGINX, Apache, GitHub Pages).
2. **Login**: Use `admin` / `password123` to access protected tools.
3. **Customize**: Update `auth.json` to change credentials.

---

**Version**: 1.1  
**Last Updated**: January 2026  
**Team**: San3a Academy Engineering
