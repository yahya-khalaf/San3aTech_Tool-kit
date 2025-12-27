# San3a Academy Toolkit - Project Structure

## 📁 File Structure

```
San3aTech_Tool-kit/
├── index.html                    # Main dashboard page
├── tools/
│   ├── qr-generator.html        # QR Code Generator tool
│   └── video-to-gif.html        # Video to GIF Converter tool
├── styles/
│   ├── main.css                 # Dashboard styles
│   ├── qr-generator.css         # QR Generator styles
│   └── video-to-gif.css         # Video to GIF styles
├── scripts/
│   ├── main.js                  # Dashboard functionality
│   ├── qr-generator.js          # QR Generator logic
│   └── video-to-gif.js          # Video to GIF logic
└── README.md                    # Documentation
```

## 🎯 Key Design Decisions

### ✅ Tool Scalability
- Each tool has its own HTML file in `tools/` directory
- Separate CSS and JS files for each tool
- Clean separation of concerns

### ✅ Developer-Only Tool Addition
- Removed "Add Tool" buttons from UI
- Tools can only be added by developers through code
- Ensures quality control and proper integration
- Clean, distraction-free dashboard for end users

### ✅ Navigation Structure
```
Dashboard (index.html)
├── Sidebar
│   ├── Dashboard (active)
│   ├── Tools Section
│   │   ├── QR Generator → tools/qr-generator.html
│   │   └── Video to GIF → tools/video-to-gif.html
│   └── Resources Section
│       ├── Documentation
│       └── Updates
└── Main Content
    ├── Welcome Card
    ├── Stats Grid (4 cards)
    ├── Tools Grid (displays available tools)
    └── Quick Actions
```

## 🔧 How to Add a New Tool

1. **Create HTML file**: `tools/new-tool.html`
2. **Update sidebar**: Add navigation link in `index.html`
3. **Add tool card**: Add card in tools grid in `index.html`
4. **Update stats**: Increment count in dashboard
5. **Create styles** (optional): `styles/new-tool.css`
6. **Create script** (optional): `scripts/new-tool.js`

## 📦 Current Tools

1. **QR Code Generator** (`tools/qr-generator.html`)
   - Generate custom QR codes
   - Customizable colors
   - Logo overlay support
   - Download as PNG

2. **Video to GIF Converter** (`tools/video-to-gif.html`)
   - Convert MP4/WEBM to GIF
   - Client-side processing (no server limit)
   - Trim video start/end time
   - Adjust FPS and Speed
   - Resize output width

## 🎨 Branding

- **Primary Color**: Red (#DC2626)
- **Logo**: San3a Academy hexagon with red background
- **Typography**: Montserrat (headers) + Inter (body)
- **Style**: Clean, minimal, professional

## 🚀 Ready for Production

The toolkit is now structured for:
- ✅ Easy tool addition by developers
- ✅ Clean user experience
- ✅ Scalability
- ✅ Maintainability
- ✅ Consistent branding

---

**Version**: 1.0  
**Last Updated**: December 2024  
**Status**: Production Ready ✅
