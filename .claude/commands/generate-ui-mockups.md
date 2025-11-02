# /generate-ui-mockup Task

When this command is used, execute the following task:

<!-- Powered by BMAD™ Core -->

# Generate Single UI Mockup Task

## Purpose

To generate a single visual mockup of the Agent Skills Registry Homepage that can be viewed locally in a browser.

## Inputs

- Completed UI/UX Specification (`docs/front-end-spec.md`)
- Design direction name and aesthetic guidelines (user will specify)

## Page Content

Focus on creating a mockup for the **Homepage** which includes (per front-end-spec.md lines 266-290):
- Hero section with heading "Discover Agent Skills for Claude"
- Search bar (full-width, 600px max, centered)
- "Explore Skills" CTA button
- Featured Skills section (3-column grid of SkillCard components, 6 skills visible)
- Categories section (6-column grid of category badges: Blockchain, Documentation, Arweave, AO Protocol, CLI Tools, AI Workflows)
- How It Works section (optional: 3 cards - Discover → Install via CLI → Activate in Claude)
- Footer with "Powered by Arweave & AO" badge and links (Documentation, GitHub, CLI Guide, Publish a Skill)

## Implementation Requirements

1. **Use React with shadcn-ui components** for production frontend continuity
2. **Include React via CDN** for easy local viewing without build step:
   - React: `<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>`
   - ReactDOM: `<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>`
   - Babel Standalone: `<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>`
3. **Include Tailwind CDN**: `<script src="https://cdn.tailwindcss.com"></script>`
4. **Use shadcn-ui components via MCP tools** to match production frontend:
   - Use `mcp__shadcn-ui__get_component_demo` to understand component usage patterns
   - Use `mcp__shadcn-ui__get_component` to get actual component source code
   - Key components: Button, Card, Badge, Avatar (for featured experts)
   - Inline component code directly in the HTML file for standalone viewing
5. **Respect front-end-spec.md requirements**:
   - Follow exact content structure from Screen 1: Homepage (docs/front-end-spec.md lines 266-290)
   - Use specified color palette from Section 6.2 (Primary: #1D63ED, Secondary: #4A90E2, Accent Teal: #00A58C, etc.) or adapt per design direction
   - Follow typography scale from Section 6.3 (Inter font, H1: 2rem/32px, Body: 1rem/16px) or adapt per design direction
   - Implement mobile-first responsive breakpoints (Mobile: 320-639px, Tablet: 640-1023px, Desktop: 1024-1439px, Wide: 1440px+)
6. **Make it fully responsive** (mobile-first approach as specified in front-end-spec.md)
7. **Use placeholder content** that matches the actual content from the spec
8. **Include placeholder images** using https://placehold.co/
9. **Ensure it's viewable by opening HTML file directly** (no build step, no server required)

## Technical Implementation

The mockup HTML file should include:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agent Skills Registry - [Design Direction Name]</title>

    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- React CDN -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

    <!-- Babel Standalone for JSX -->
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

    <!-- Google Fonts (Inter or design-direction-specific) -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

    <!-- Tailwind Custom Config -->
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        // Custom colors from front-end-spec.md Section 6.2
                        primary: '#1D63ED',
                        secondary: '#4A90E2',
                        accentTeal: '#00A58C',
                        accentRed: '#E65264',
                        accentAmber: '#DB7512',
                    }
                }
            }
        }
    </script>
</head>
<body>
    <div id="root"></div>

    <!-- Inline shadcn-ui components (Button, Card, Badge, SearchBar) -->
    <script type="text/babel">
        // shadcn-ui components inlined here (Button, Card, Badge, SearchBar)

        // Main App Component
        const App = () => {
            return (
                <div className="min-h-screen bg-neutral-50">
                    {/* Hero Section - front-end-spec.md lines 272-277 */}
                    <section className="hero container mx-auto px-4 py-16 text-center">
                        <h1 className="text-4xl font-semibold mb-4">Discover Agent Skills for Claude</h1>
                        <p className="text-lg text-neutral-600 mb-8">Value proposition subheading here</p>
                        <div className="max-w-xl mx-auto mb-4">
                            {/* Search bar component */}
                        </div>
                        <button className="btn-secondary">Explore Skills</button>
                    </section>

                    {/* Featured Skills Section - lines 278-282 */}
                    <section className="featured-skills container mx-auto px-4 py-12">
                        <h2 className="text-2xl font-semibold mb-6">Featured Skills</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* 6 SkillCard components (320px width, 240px height each) */}
                        </div>
                        <div className="text-center mt-6">
                            <a href="#" className="text-primary hover:underline">View All</a>
                        </div>
                    </section>

                    {/* Categories Section - lines 283-286 */}
                    <section className="categories container mx-auto px-4 py-12">
                        <h2 className="text-2xl font-semibold mb-6">Browse by Category</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {/* Category badges: Blockchain, Documentation, Arweave, AO Protocol, CLI Tools, AI Workflows */}
                        </div>
                    </section>

                    {/* How It Works Section (optional) - lines 287-289 */}
                    <section className="how-it-works container mx-auto px-4 py-12">
                        <h2 className="text-2xl font-semibold mb-6">How It Works</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* 3 cards: 1. Discover → 2. Install via CLI → 3. Activate in Claude */}
                        </div>
                    </section>

                    {/* Footer - line 290 */}
                    <footer className="py-8 border-t">
                        <div className="container mx-auto px-4 text-center">
                            <p className="mb-4">Powered by Arweave & AO</p>
                            <div className="flex justify-center gap-6">
                                <a href="#" className="text-neutral-600 hover:text-primary">Documentation</a>
                                <a href="#" className="text-neutral-600 hover:text-primary">GitHub</a>
                                <a href="#" className="text-neutral-600 hover:text-primary">CLI Guide</a>
                                <a href="#" className="text-neutral-600 hover:text-primary">Publish a Skill</a>
                            </div>
                        </div>
                    </footer>
                </div>
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    </script>
</body>
</html>
```

## Execution Steps

1. **Prompt user for design direction** if not already specified
2. **Create mockup directory**: `mockups/[design-name]/`
3. **Fetch shadcn-ui component demos and source** for Button, Card, Badge, Avatar
4. **Generate single HTML file** with inlined React components matching the Landing Page spec
5. **Open in browser** using Bash: `open mockups/[design-name]/index.html`

## Output Format

After generating the mockup:

```
✅ Generated UI Mockup: [Design Direction Name]

📁 Location: /Users/jonathangreen/Documents/Permamind/mockups/[design-name]/

🌐 View Mockup:
   open mockups/[design-name]/index.html
```

## Important Notes

- **Ensure mobile-responsive** - test at 320px, 768px, 1024px, 1440px widths
- **Use semantic HTML** for accessibility
- **Include hover states** to show interactivity
- **Viewable without local server** - pure HTML/CSS/CDN resources
- **Focus on conveying the overall aesthetic** - don't obsess over pixel-perfection

## Success Criteria

✅ Single HTML mockup page created with design direction applied
✅ Matches Homepage content structure from front-end-spec.md (lines 266-290)
✅ Uses shadcn-ui components (Button, Card, Badge, SearchBar) inlined
✅ Mobile-responsive at all breakpoints (320px, 640px, 1024px, 1440px)
✅ Can be opened directly in browser (no build step)
