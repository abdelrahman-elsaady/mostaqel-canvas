# T-Shirt Design Editor

A web-based t-shirt customization tool built with HTML5 Canvas, CSS, and JavaScript, served with Express.js.

## Features

- 🎨 Change t-shirt color with one click
- 📁 Upload and add custom designs/images
- 🖱️ Drag and drop designs on the t-shirt
- 📏 Resize designs (10% - 200%)
- 🔄 Rotate designs (0° - 360°)
- 💾 Save the final design as PNG
- 🗑️ Delete unwanted designs

## Quick Start

### Option 1: Windows (Easiest)
1. Double-click `start.bat`
2. Wait for dependencies to install
3. Browser will open automatically to `http://localhost:3000`

### Option 2: Manual Setup
1. Install Node.js (if not already installed)
2. Open terminal/command prompt in this folder
3. Run: `npm install`
4. Run: `npm start`
5. Open browser to: `http://localhost:3000`

## How to Use

1. **Change T-shirt Color**: Click any color button
2. **Add Design**: Click "Upload Image" and select an image file
3. **Move Design**: Click and drag the design on the canvas
4. **Resize Design**: Select a design and use the size slider
5. **Rotate Design**: Select a design and use the rotation slider
6. **Delete Design**: Select a design and click "Delete Design"
7. **Save Design**: Click "Save Design" to download as PNG

## File Structure

```
├── index.html          # Main application
├── server.js           # Express.js server
├── package.json        # Node.js dependencies
├── start.bat          # Windows startup script
├── t-shirt.png        # T-shirt template image
└── README.md          # This file
```

## Requirements

- Node.js (version 14 or higher)
- Modern web browser (Chrome, Firefox, Safari, Edge)
- T-shirt image should be white/light colored with transparent background

## Troubleshooting

### Save Function Not Working
- Make sure you're running through the Express server (`http://localhost:3000`)
- Don't open the HTML file directly in the browser
- Check browser console (F12) for error messages

### Image Not Loading
- Ensure `t-shirt.png` is in the same folder as `index.html`
- Check that the image file is not corrupted

### Server Won't Start
- Make sure Node.js is installed
- Try running `npm install` manually
- Check if port 3000 is already in use

## Development

To run in development mode with auto-restart:
```bash
npm run dev
```

## License

MIT License 