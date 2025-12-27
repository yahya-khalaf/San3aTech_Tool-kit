# San3a Academy Toolkit

Internal tools dashboard for the San3a Academy team.

## 🎨 Design

- **Modern Dashboard UI** with sidebar navigation
- **Red Branding** (#DC2626) consistent with San3a Academy logo
- **Minimal Text** - Clean, focused interface
- **Responsive** - Works on desktop, tablet, and mobile

## 🗂️ Project Structure

```
San3aTech_Tool-kit/
├── index.html           # Main dashboard page
├── styles/
│   └── main.css        # Dashboard styles (red branding, sidebar layout)
├── scripts/
│   └── main.js         # Interactive functionality
└── README.md           # This file
```

## 🚀 Getting Started

1. Open `index.html` in your browser
2. The sidebar shows available tools and navigation
3. Use the "Add Tool" button to add new tools to your dashboard

## 📋 Features

### Current
- ✅ Sidebar navigation with sections
- ✅ Dashboard overview with stats
- ✅ QR Code Generator tool
- ✅ Video to GIF Converter tool
- ✅ Quick action cards
- ✅ Responsive mobile menu
- ✅ User profile section
- ✅ Keyboard shortcuts (Cmd/Ctrl + K for search)

### Coming Soon
- 🔄 More tools (added by developers)
- 🔄 Search functionality
- 🔄 Notifications panel
- 🔄 Settings page
- 🔄 Documentation pages

## 🎯 Adding New Tools (For Developers)

To add a new tool to the toolkit:

1. **Create the tool page**: Create a new HTML file in `tools/` directory (e.g., `tools/my-tool.html`)
2. **Add navigation**: Update `index.html` sidebar to add a link in the "Tools" section
3. **Add tool card**: Update the tools grid in `index.html` to display a card for your tool
4. **Update stats**: Increment the "Total Tools" count in the dashboard stats
5. **Add styles**: Create a CSS file in `styles/` if needed (e.g., `styles/my-tool.css`)
6. **Add functionality**: Create a JS file in `scripts/` for interactivity (e.g., `scripts/my-tool.js`)

**Note**: Tools are only added through code by developers, not through the UI. This ensures quality control and proper integration.

## 🎨 Color Scheme

- **Primary Red**: #DC2626
- **Red Dark**: #B91C1C  
- **Red Light**: #FEE2E2
- **Gray Scale**: From #F9FAFB to #111827
- **Accent Colors**: Blue (#3B82F6), Green (#10B981), Yellow (#F59E0B)

## 💡 Usage Tips

- **Keyboard Shortcuts**: Use Cmd/Ctrl + K for search
- **Mobile**: Tap the menu icon to toggle sidebar
- **Navigation**: Click on tool cards to open the tool in a new page
- **Customization**: Edit CSS variables in `/styles/main.css` to adjust colors and spacing
- **Adding Tools**: Only developers can add tools through code to maintain quality

## 📝 Notes

This is an internal tool for the San3a Academy team. The design prioritizes:
- Quick access to tools
- Clean, professional interface
- Easy scalability for future features
- Minimal text, maximum clarity

---

**Version**: 1.0  
**Last Updated**: 2024  
**Team**: San3a Academy
