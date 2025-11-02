# Recording Instructions for Skill Creator GIF

## Setup

1. **Open the animation**:
   ```bash
   open output/skill-creator-hero.html
   ```

2. **Browser setup**:
   - Use Chrome or Firefox
   - Window size: 1400x900px
   - Zoom: 100%
   - Hide browser UI (press F11 for fullscreen)

## Recording Options

### Option 1: macOS QuickTime (Recommended)
```bash
# Open QuickTime Player
open -a "QuickTime Player"

# File → New Screen Recording
# Select the browser window
# Record for 15-20 seconds (one full loop)
# Save as skill-creator-recording.mov
```

### Option 2: ffmpeg Command
```bash
# If you have ffmpeg installed
ffmpeg -f avfoundation -i "1" -t 20 -r 30 output/skill-creator-recording.mov
```

### Option 3: Chrome DevTools
1. Open DevTools (Cmd+Option+I)
2. Open Command Palette (Cmd+Shift+P)
3. Type "Capture screenshot" → "Capture node screenshot"
4. Or use an extension like "Screen Recorder"

## Convert to GIF

### Using ffmpeg (Best Quality)
```bash
# Convert to high-quality GIF
ffmpeg -i output/skill-creator-recording.mov \
  -vf "fps=15,scale=1200:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5" \
  -loop 0 \
  output/skill-creator.gif

# Optimize with gifsicle
gifsicle -O3 --colors 256 output/skill-creator.gif -o output/skill-creator-optimized.gif
```

### Alternative: Online Converter
1. Upload to https://ezgif.com/video-to-gif
2. Settings:
   - Frame rate: 15 fps
   - Size: 1200px width
   - Method: ffmpeg
   - Colors: 256
3. Download optimized GIF

## Quality Checks

✓ **File size**: Should be under 5MB for Twitter
✓ **Dimensions**: 1200px wide (or 1000px for Instagram)
✓ **Loop**: Smooth transition from end to start
✓ **Duration**: 15-20 seconds
✓ **Readability**: Text is crisp and clear

## Quick Recording Script

```bash
#!/bin/bash

# Open the HTML file
open output/skill-creator-hero.html

echo "Recording will start in 3 seconds..."
sleep 3

# Record for 20 seconds
echo "Recording..."
# Manually start QuickTime or your recording tool

sleep 20

echo "Done! Now convert to GIF with:"
echo "ffmpeg -i recording.mov -vf \"fps=15,scale=1200:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse\" output/skill-creator.gif"
```

## Twitter-Specific Export

For Twitter, use these settings:
- **Max file size**: 15MB (5MB recommended)
- **Max dimensions**: 1280x1080px
- **Formats**: GIF, MP4
- **Recommended**: 1200x1000px GIF at 15fps

## Instagram-Specific Export

For Instagram:
- **Aspect ratio**: 1:1 (square) or 4:5 (portrait)
- **Dimensions**: 1080x1080px (square) or 1080x1350px (portrait)
- **Format**: MP4 (GIFs get downgraded)
- **Duration**: Up to 60 seconds

Convert to Instagram format:
```bash
# Square format
ffmpeg -i output/skill-creator-recording.mov \
  -vf "scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 -preset slow -crf 22 \
  output/skill-creator-instagram.mp4
```

## Final Checklist

- [ ] HTML animation opens correctly
- [ ] Recording captured (20 seconds)
- [ ] Converted to GIF
- [ ] Optimized for size
- [ ] Tested on social platforms
- [ ] Text is readable
- [ ] Smooth loop
- [ ] Colors look good

## Quick Commands Summary

```bash
# 1. Open animation
open output/skill-creator-hero.html

# 2. Record with QuickTime (manual)
# File → New Screen Recording

# 3. Convert to GIF
ffmpeg -i recording.mov \
  -vf "fps=15,scale=1200:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" \
  output/skill-creator.gif

# 4. Optimize
gifsicle -O3 --colors 256 output/skill-creator.gif \
  -o output/skill-creator-final.gif
```

## Pro Tips

1. **Smooth recording**: Wait 2 seconds before starting to let animation stabilize
2. **File size**: If GIF is too large, reduce fps to 12 or scale to 1000px
3. **Quality**: Use higher bayer_scale (5-6) for better dithering
4. **Testing**: Always test GIF in actual social platform upload
5. **Alternatives**: Consider posting as MP4 video for better quality on Twitter

## Resources

- ffmpeg: `brew install ffmpeg`
- gifsicle: `brew install gifsicle`
- Color palette: The animation uses #6ee7b7 (green) and #3b82f6 (blue)
