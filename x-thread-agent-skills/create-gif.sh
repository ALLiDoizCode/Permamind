#!/bin/bash

# Simple script to create GIF from the animated HTML
# This uses manual screen recording + ffmpeg conversion

set -e

echo "🎬 Permamind GIF Creation Guide"
echo "================================"
echo ""

HTML_PATH="$(pwd)/images/01-hero-animated.html"
OUTPUT_DIR="$(pwd)/output"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "📂 Output directory: $OUTPUT_DIR"
echo ""

# Check for required tools
echo "🔍 Checking dependencies..."
echo ""

FFMPEG_OK=false
GIFSICLE_OK=false

if command -v ffmpeg &> /dev/null; then
    echo "✓ ffmpeg found"
    FFMPEG_OK=true
else
    echo "⚠️  ffmpeg not found - install with: brew install ffmpeg"
fi

if command -v gifsicle &> /dev/null; then
    echo "✓ gifsicle found"
    GIFSICLE_OK=true
else
    echo "⚠️  gifsicle not found - install with: brew install gifsicle"
fi

echo ""
echo "📝 Recording Instructions:"
echo "=========================="
echo ""
echo "1. Open the animation in your browser:"
echo "   open '$HTML_PATH'"
echo ""
echo "2. Use QuickTime Player to record:"
echo "   - Open QuickTime Player"
echo "   - File → New Screen Recording"
echo "   - Select the browser window (drag to frame terminal only)"
echo "   - Click Record button"
echo "   - Let animation run for 20 seconds (2 complete loops)"
echo "   - Click Stop in menu bar"
echo "   - File → Save → Save to: $OUTPUT_DIR/recording.mov"
echo ""
echo "3. After saving, return here and press Enter to convert to GIF..."

# Open the HTML file
open "$HTML_PATH"

# Wait for user to complete recording
read -p "Press Enter after you've saved the recording as '$OUTPUT_DIR/recording.mov'..."

RECORDING_PATH="$OUTPUT_DIR/recording.mov"

if [ ! -f "$RECORDING_PATH" ]; then
    echo ""
    echo "❌ Recording not found at: $RECORDING_PATH"
    echo ""
    echo "Please save your QuickTime recording as:"
    echo "  $RECORDING_PATH"
    echo ""
    echo "Then run this command:"
    exit 1
fi

if [ "$FFMPEG_OK" = false ]; then
    echo ""
    echo "⚠️  ffmpeg required for conversion. Install with:"
    echo "   brew install ffmpeg"
    echo ""
    echo "Then run:"
    echo "  ffmpeg -i '$RECORDING_PATH' \\"
    echo "    -vf \"fps=30,scale=1200:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse\" \\"
    echo "    -loop 0 \\"
    echo "    '$OUTPUT_DIR/permamind-hero.gif'"
    exit 1
fi

echo ""
echo "🎨 Converting to GIF..."
echo ""

ffmpeg -i "$RECORDING_PATH" \
  -vf "fps=30,scale=1200:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" \
  -loop 0 \
  "$OUTPUT_DIR/permamind-hero.gif" \
  -y

GIF_SIZE=$(du -h "$OUTPUT_DIR/permamind-hero.gif" | cut -f1)
echo ""
echo "✓ GIF created: $OUTPUT_DIR/permamind-hero.gif"
echo "  Size: $GIF_SIZE"

if [ "$GIFSICLE_OK" = true ]; then
    echo ""
    echo "⚙️  Optimizing GIF..."
    echo ""

    gifsicle -O3 --lossy=80 --colors=256 \
      "$OUTPUT_DIR/permamind-hero.gif" \
      -o "$OUTPUT_DIR/permamind-hero-optimized.gif"

    OPTIMIZED_SIZE=$(du -h "$OUTPUT_DIR/permamind-hero-optimized.gif" | cut -f1)

    echo ""
    echo "✓ GIF optimized: $OUTPUT_DIR/permamind-hero-optimized.gif"
    echo "  Size: $OPTIMIZED_SIZE"

    # Check if under 5MB
    SIZE_BYTES=$(stat -f%z "$OUTPUT_DIR/permamind-hero-optimized.gif")
    if [ $SIZE_BYTES -lt 5242880 ]; then
        echo ""
        echo "✅ File size is under 5MB - ready for Twitter!"
    else
        echo ""
        echo "⚠️  File is over 5MB. Try higher compression:"
        echo "  gifsicle -O3 --lossy=100 --colors=128 '$OUTPUT_DIR/permamind-hero.gif' -o '$OUTPUT_DIR/permamind-hero-optimized.gif'"
    fi

    # Open optimized GIF
    echo ""
    echo "📂 Opening optimized GIF..."
    open "$OUTPUT_DIR/permamind-hero-optimized.gif"
else
    echo ""
    echo "⚠️  Install gifsicle to optimize:"
    echo "   brew install gifsicle"
    echo ""
    echo "Then run:"
    echo "  gifsicle -O3 --lossy=80 --colors=256 '$OUTPUT_DIR/permamind-hero.gif' -o '$OUTPUT_DIR/permamind-hero-optimized.gif'"

    # Open unoptimized GIF
    echo ""
    echo "📂 Opening GIF..."
    open "$OUTPUT_DIR/permamind-hero.gif"
fi

echo ""
echo "🎉 Done! Next steps:"
echo "   1. Review the GIF"
echo "   2. Post to Twitter with content from content/SINGLE_POST.md"
echo "   3. Add alt text: 'Animated terminal showing Permamind CLI commands'"
echo ""
