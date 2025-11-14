---
description: Generate a terminal-style animated GIF for a skill from its SKILL.md file
example_invocations:
  - /skill-gif path="./.claude/skills/content-ideation"
  - /skill-gif path="../.claude/skills/ao-basics" icon="⚡"
  - /skill-gif path="~/.claude/skills/web-scraping"
---

# Skill GIF Generator

Generate a retro terminal-style animated GIF for announcing skills in the Permamind registry by reading the skill's SKILL.md file.

## Arguments

- **path**: Path to the skill directory containing SKILL.md (required)
- **icon**: Optional emoji icon override (defaults to geometric star pattern SVG)

## Steps

1. **Read SKILL.md** from the provided path (e.g., `{path}/SKILL.md`)
2. **Parse YAML frontmatter** to extract:
   - `name`: Skill name
   - `description`: Skill description (use first sentence or summary)
3. **Use icon** from argument or default to 📦
4. **Create custom HTML** based on `skill-unlock-terminal.html` template with the extracted metadata
5. **Use Playwright** to record the animation as video
6. **Convert to GIF** using ffmpeg
7. **Save to**: `/Users/jonathangreen/Documents/Permamind/outputs/media/skill-{name-kebab-case}.gif`
8. **Clean up** temporary files (HTML and video)
9. **Report success** with output path and file size

## SKILL.md Format

Expected YAML frontmatter:
```yaml
---
name: Content Ideation
description: Generate creative content ideas, marketing strategies, and engaging copy for social media campaigns
---
```

## Implementation Details

1. **Read** `{path}/SKILL.md` using the Read tool
2. **Parse YAML** frontmatter to extract `name` and `description`
3. **Convert** skill name to kebab-case (e.g., "Content Ideation" → "content-ideation")
4. **Copy** `/Users/jonathangreen/Documents/Permamind/frontend/skill-unlock-terminal.html` to a temporary file in `.playwright-mcp/`
5. **Replace** in the HTML JavaScript:
   - Line 281: `'Content Ideation'` → extracted name (uppercase for AO if applicable)
   - Line 282: Description text → extracted description
   - Line 243: `content-ideation` → skill name in kebab-case for install command
6. **Create recording script** in `.playwright-mcp/record-{skill}-skill.js`:
   - Import chromium from playwright
   - Set viewport to 800x600
   - Navigate to temporary HTML file
   - Wait 500ms for black background to load
   - Record for 11 seconds
   - Save video to `.playwright-mcp/`
7. **Run Playwright recording** with `node record-{skill}-skill.js`
8. **Convert video to GIF** using ffmpeg:
   ```bash
   ffmpeg -ss 0.6 -i {video}.webm \
     -vf "fps=20,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" \
     -loop 0 /Users/jonathangreen/Documents/Permamind/outputs/media/skill-{kebab-name}.gif -y
   ```
   - `-ss 0.6`: Trim first 0.6 seconds (removes white flash and duplicate frames)
   - `fps=20`: 20 frames per second for smooth animation
   - `max_colors=256`: 256 color palette for quality
   - `-loop 0`: Infinite loop
9. **Clean up** temporary HTML, JS, and video files
10. **Report success** with output path and file size

## Template Locations

- **Template**: `/Users/jonathangreen/Documents/Permamind/frontend/skill-unlock-terminal.html`
- **Working dir**: `/Users/jonathangreen/Documents/Permamind/frontend/`
- **Output dir**: `/Users/jonathangreen/Documents/Permamind/outputs/media/`

## Text Replacements in HTML

Find and replace these in the template JavaScript (lines 279-292):
- Line 281: `typeText(skillName, 'Content Ideation', 70` → skill name (use uppercase like 'AO' if applicable)
- Line 282: `typeText(description, 'Generate creative...', 30` → extracted description
- Line 243: `<span class="prompt">$</span> skills install content-ideation` → `skills install {kebab-case-name}`

**Note:** The icon (geometric star SVG) is already embedded in the template and doesn't need replacement unless overridden.

## Output

Final GIF location: `/Users/jonathangreen/Documents/Permamind/outputs/media/skill-{name-kebab-case}.gif`

Example: `skill-content-ideation.gif`

## Success Criteria

- ✅ GIF is under 5MB
- ✅ Animation loops perfectly at ~13 seconds (11s recording + margins)
- ✅ Text matches SKILL.md metadata exactly
- ✅ File saved to outputs/media/ directory
- ✅ Temporary files cleaned up
- ✅ Terminal styling matches template (green phosphor, scanlines, CRT effects)
- ✅ No border or header bar for clean, minimal design
- ✅ Rounded corners (16px) for X/Twitter compatibility
- ✅ No white flash or duplicate frames at start
