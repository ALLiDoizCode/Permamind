# GIF Creation Guide - Updated

## ✅ Changes Made

### Animation Updates
- ✅ Changed `skills install ao-development` → `skills install ao`
- ✅ Added 3-second pause at end of animation (12s total per loop)
- ✅ Duration: 24 seconds for 2 complete loops

### Key Details
- **File**: `images/01-hero-animated.html`
- **Loop duration**: 12 seconds (9s animation + 3s pause)
- **Recording duration**: 24 seconds (2 loops recommended)
- **Output size**: 1200×675 (Twitter optimal)

---

## 🎬 Creating the GIF

### Option 1: Automated Script (Recommended)

```bash
cd x-thread-agent-skills
./create-gif.sh
```

**The script will:**
1. Check for ffmpeg and gifsicle
2. Open the animation in your browser
3. Guide you through QuickTime screen recording
4. Auto-convert to GIF
5. Auto-optimize for Twitter

**Requirements:**
- macOS with QuickTime Player (built-in)
- ffmpeg: `brew install ffmpeg`
- gifsicle: `brew install gifsicle` (optional, for optimization)

---

### Option 2: Manual Recording with LICEcap

**Best for:** Quick, simple GIF creation

```bash
# 1. Download LICEcap
open https://www.cockos.com/licecap/

# 2. Open animation
open images/01-hero-animated.html

# 3. In LICEcap:
#    - Frame the terminal (no browser chrome)
#    - Set FPS: 30
#    - Click "Record"
#    - Wait 24 seconds (2 complete loops)
#    - Click "Stop"
#    - Save as: output/permamind-hero.gif

# 4. Optimize
gifsicle -O3 --lossy=80 --colors=256 \
  output/permamind-hero.gif \
  -o output/permamind-hero-optimized.gif
```

---

### Option 3: Manual with QuickTime + ffmpeg

**Best for:** Highest quality

```bash
# 1. Open animation
open images/01-hero-animated.html

# 2. Record with QuickTime Player
#    - File → New Screen Recording
#    - Frame terminal window only
#    - Record for 24 seconds (2 loops)
#    - Save as: output/recording.mov

# 3. Convert to GIF
mkdir -p output
ffmpeg -i output/recording.mov \
  -vf "fps=30,scale=1200:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" \
  -loop 0 \
  output/permamind-hero.gif

# 4. Optimize
gifsicle -O3 --lossy=80 --colors=256 \
  output/permamind-hero.gif \
  -o output/permamind-hero-optimized.gif
```

---

## 📊 Animation Timeline

```
[0s] PERMAMIND
     Decentralized Agent Skills Registry

[0.5s] $ skills search arweave
[1.2s] → Found 12 skills matching "arweave"

[2.2s] $ skills install ao
[2.9s] → ✓ Downloaded from Arweave
        ✓ Dependencies resolved
        ✓ Installed to ~/.claude/skills/

[4.2s] $ skills publish ./my-skill
[4.9s] → ✓ Published to Arweave: abc123...xyz789
        → Your expertise is now permanent and globally discoverable

[6.2s] 🚀 Publish • Discover • Install
       $ npm install -g @permamind/skills

[9s-12s] ⏸️ PAUSE (3 seconds)

[12s] → Loop restarts
```

---

## ✅ Quality Checklist

Before posting to Twitter:

### File Requirements
- [ ] File size under 5MB (Twitter optimal, 15MB max)
- [ ] Dimensions: 1200×675 pixels
- [ ] Format: GIF (optimized)
- [ ] Duration: 24 seconds
- [ ] Frame rate: 30 FPS

### Content Requirements
- [ ] Shows all 3 commands (search, install, publish)
- [ ] Text is readable
- [ ] Colors render correctly (terminal theme)
- [ ] No browser chrome visible
- [ ] 3-second pause before loop
- [ ] Smooth loop transition

### Twitter Requirements
- [ ] Alt text added: "Animated terminal showing Permamind CLI commands for searching, installing, and publishing Agent Skills"
- [ ] Tweet copy selected (see `content/SINGLE_POST.md`)
- [ ] Hashtags included: #AgentSkills #ClaudeAI #Arweave
- [ ] Optional tags: @AnthropicAI @ArweaveEco

---

## 🎨 Optimization Tips

### If file is too large (>5MB):

```bash
# Higher compression
gifsicle -O3 --lossy=100 --colors=128 \
  output/permamind-hero.gif \
  -o output/permamind-hero-compressed.gif

# Or reduce FPS
ffmpeg -i output/recording.mov \
  -vf "fps=20,scale=1200:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" \
  -loop 0 \
  output/permamind-hero-20fps.gif
```

### If colors look off:

```bash
# Use custom palette
ffmpeg -i output/recording.mov \
  -vf "fps=30,scale=1200:-1:flags=lanczos,palettegen=stats_mode=full" \
  -y output/palette.png

ffmpeg -i output/recording.mov -i output/palette.png \
  -lavfi "fps=30,scale=1200:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer" \
  output/permamind-hero.gif
```

---

## 🚀 Quick Commands Reference

```bash
# Install dependencies (macOS)
brew install ffmpeg gifsicle

# Run automated script
./create-gif.sh

# Manual conversion
ffmpeg -i input.mov \
  -vf "fps=30,scale=1200:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" \
  -loop 0 output.gif

# Optimize
gifsicle -O3 --lossy=80 --colors=256 input.gif -o output.gif

# Check size
ls -lh output/permamind-hero-optimized.gif

# Preview
open output/permamind-hero-optimized.gif
```

---

## 📝 Tweet Copy (Option 1 - Recommended)

```
Share your AI expertise with the world.

Permamind: The decentralized Agent Skills registry on Arweave.

🔍 Discover skills globally
📦 Install with dependencies
🚀 Publish once, available forever

$ npm install -g @permamind/skills

Built on Arweave + AO

#AgentSkills #ClaudeAI #Arweave
```

**Character count**: 268/280
**With GIF + tags**: Ready to post!

See `content/SINGLE_POST.md` for 4 more tweet variations.

---

## 🆘 Troubleshooting

### "ffmpeg: command not found"
```bash
brew install ffmpeg
```

### "gifsicle: command not found"
```bash
brew install gifsicle
```

### GIF too large
- Increase lossy compression: `--lossy=100`
- Reduce colors: `--colors=128`
- Reduce frame rate: `fps=20` instead of `fps=30`
- Record only 1 loop (12s) instead of 2 (24s)

### Terminal theme colors wrong
- Ensure browser is not in dark mode
- Disable browser extensions
- Use Chrome/Chromium for consistent rendering

### Animation doesn't loop smoothly
- Ensure you recorded full 24 seconds (2 loops)
- Check that pause at end is visible (9s-12s)
- Preview before posting to verify

---

## 📁 Output Files

After running the script, you'll have:

```
output/
├── recording.mov              (if using QuickTime method)
├── permamind-hero.gif         (unoptimized)
└── permamind-hero-optimized.gif  (ready for Twitter!)
```

Use `permamind-hero-optimized.gif` for posting.

---

**Ready to create your GIF? Run: `./create-gif.sh`**

*Last updated: 2025-10-27*
*Animation: 12s loop (9s + 3s pause)*
*Command: `skills install ao`*
