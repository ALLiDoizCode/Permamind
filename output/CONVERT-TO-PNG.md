# Convert HTML to PNG

## Quick Method (Screenshot)

### macOS:
1. Open the HTML file (should already be open in your browser)
2. Press `Cmd + Shift + 4` then press `Space`
3. Click on the browser window
4. Save as `skill-creator.png`

### Alternative - Full Page Screenshot:

1. Open Chrome DevTools: `Cmd + Option + I`
2. Open Command Palette: `Cmd + Shift + P`
3. Type: "Capture full size screenshot"
4. Press Enter
5. Rename file to `skill-creator.png`

## High Quality Method (Using Browser)

### Firefox:
1. Right-click on the page
2. Select "Take Screenshot"
3. Click "Save full page"
4. Save as `skill-creator.png`

### Chrome Extension Method:
1. Install "GoFullPage" extension
2. Click the extension icon
3. Download the PNG

## Command Line Method (if you have node/puppeteer)

I can create a script for you to automate this. Want me to create it?

## Recommended Settings

- **Width**: 1200px (already set in the HTML)
- **Format**: PNG
- **Quality**: Maximum
- **Background**: Included (gradient background)

## Quick Command

If you just want to screenshot the browser window now:

```bash
# Take screenshot (macOS)
# Press: Cmd + Shift + 4
# Then: Space
# Then: Click the browser window
# File will be saved to Desktop as "Screenshot [date].png"
```

Then rename it:
```bash
mv ~/Desktop/Screenshot*.png output/skill-creator.png
```
