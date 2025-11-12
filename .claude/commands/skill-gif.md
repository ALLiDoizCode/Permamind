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
- **icon**: Optional emoji icon override (defaults to 📦)

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
4. **Copy** `/Users/jonathangreen/Documents/Permamind/frontend/skill-unlock-terminal.html` to a temporary file
5. **Replace** in the HTML:
   - The skill icon (📦 → provided icon)
   - The skill name ("Content Ideation" → extracted name)
   - The description text → extracted description
6. **Use Playwright** to:
   - Navigate to the temporary HTML file
   - Record video for 8 seconds
   - Save video to `.playwright-mcp/`
7. **Convert video to GIF** using ffmpeg with optimized settings
8. **Move GIF** to `/Users/jonathangreen/Documents/Permamind/outputs/media/skill-{kebab-name}.gif`
9. **Clean up** temporary HTML and video files

## Template Locations

- **Template**: `/Users/jonathangreen/Documents/Permamind/frontend/skill-unlock-terminal.html`
- **Working dir**: `/Users/jonathangreen/Documents/Permamind/frontend/`
- **Output dir**: `/Users/jonathangreen/Documents/Permamind/outputs/media/`

## Text Replacements in HTML

Find and replace these in the template:
- `📦` → provided icon
- `'Content Ideation'` → skill name
- `'Generate creative content ideas, marketing strategies, and engaging copy for social media campaigns'` → skill description

## Output

Final GIF location: `/Users/jonathangreen/Documents/Permamind/outputs/media/skill-{name-kebab-case}.gif`

Example: `skill-content-ideation.gif`

## Success Criteria

- ✅ GIF is under 3MB
- ✅ Animation loops perfectly at 8 seconds
- ✅ Text matches SKILL.md metadata exactly
- ✅ File saved to outputs/media/ directory
- ✅ Temporary files cleaned up
- ✅ Terminal styling matches template (green phosphor, scanlines, CRT effects)
