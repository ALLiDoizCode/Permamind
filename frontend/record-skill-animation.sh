#!/bin/bash

# Script to record browser animation and convert to GIF

HTML_FILE="$(pwd)/skill-unlock-animation.html"
OUTPUT_DIR="$(pwd)/.playwright-mcp"
GIF_OUTPUT="$OUTPUT_DIR/skill-unlock.gif"

echo "Creating output directory..."
mkdir -p "$OUTPUT_DIR"

echo "Opening HTML file in browser..."
echo "Please manually:"
echo "1. Open: file://$HTML_FILE"
echo "2. Use QuickTime Player or other screen recorder to record the animation"
echo "3. Save the video as skill-unlock.mov in $OUTPUT_DIR"
echo ""
echo "Once you have the video file, run this to convert to GIF:"
echo ""
echo "ffmpeg -i $OUTPUT_DIR/skill-unlock.mov -vf \"fps=20,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse\" -loop 0 $GIF_OUTPUT"
