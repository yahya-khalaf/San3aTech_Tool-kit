# 🚀 San3a Academy Toolkit

> **The ultimate internal power-suite for the San3a Academy team.**

Internal tools dashboard featuring live course scheduling, collaborative utilities, and performance analytics. Designed for speed, precision, and a premium user experience.

---

## 🎨 Design Philosophy

- **Premium Aesthetic**: Clean, modern UI using San3a's signature Red (`#DC2626`) and deep charcoal accents.
- **Glassmorphism**: Elegant, semi-transparent interface elements for a state-of-the-art feel.
- **Unified Experience**: Consistent navigation and design language across all internal tools.

---

## 🧰 The Tool Suite

### 1. 📅 Crash Courses Calendar
The core of our scheduling operations.
- **Live Sync**: Pulls real-time data from Google Sheets.
- **Intelligent Shifting**: Automatically detects vacations/clashes and moves sessions to the next available slot.
- **Filtering**: View by room, course, or instructor.

### 2. 🎨 Online Whiteboard
Real-time collaborative drawing for brainstorming and meetings.
- **Zero Latency**: Powered by real-time sync for seamless teamwork.
- **Versatile Tools**: Support for drawing, shapes, and annotations.

### 3. 📊 Team & Individual WIGs
Performance tracking dashboards for Academy goals.
- **Visual Analytics**: Progress bars and leaderboards.
- **Goal Alignment**: Ensures everyone is focused on Wildly Important Goals.

### 4. 🛠️ Utility Toolbox
- **QR Generator**: Create branded QR codes for course materials.
- **Video to GIF**: Instant, client-side conversion for social media and documentation.

---

## 🚀 Getting Started

### Prerequisites
- Any modern web browser (Chrome, Safari, Edge).
- No backend installation required; runs as a distributed static application.

### Setup & Deployment
1. **Clone**: Pull the repository to your local machine or server.
2. **Configure**: Update `auth.json` with your desired credentials.
3. **Deploy**: Host the root folder on any static provider (GitHub Pages, Vercel, or internal NGINX).

---

## 🛠️ Developer Guide

### Updating the Calendar Logic
The **May Calendar** logic is located in `May calender/main.js`. 
- To modify holiday logic, adjust the `isVacation()` function.
- To update column mappings, see the `processScheduler()` function.

### Adding New Tools
Integration is standardized. Visit [PROJECT_STRUCTURE.md](file:///Users/yahyaalariny/Documents/GitHub/San3aTech_Tool-kit/PROJECT_STRUCTURE.md) for a step-by-step guide on adding new utilities to the dashboard.

---

## 📦 Tech Stack
- **Frontend**: HTML5, Vanilla JavaScript (ES6+), CSS3 (Custom Variables).
- **Modules**: Vite (Calendar), Socket.io (Whiteboard logic).
- **Data Integration**: Google Sheets CSV API.

---

**Version**: 1.2  
**Last Updated**: January 2026  
**Engineering**: San3a Academy Product Team
