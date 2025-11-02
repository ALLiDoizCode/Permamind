# /extend-mockup {mockup_number} Task

When this command is used with a mockup number (e.g., `/extend-mockup 01`), execute the following task:

<!-- Powered by BMAD™ Core -->

# Extend UI Mockup with Full Application

## Purpose

To extend an existing single-page mockup into a complete multi-page application with all screens, components, and navigation defined in the front-end spec (`docs/front-end-spec.md`).

## Inputs

- **Mockup Number** (required): Number of existing mockup directory (e.g., `01` for `mockups/01-modern-minimalist/`)
- **Completed UI/UX Specification**: `docs/front-end-spec.md`
- **Existing Mockup**: `mockups/{mockup_number}-{design-name}/index.html`

## Validation

1. **Check mockup exists**: Verify directory `mockups/{mockup_number}-*` exists
2. **Read existing design**: Parse existing `index.html` to extract:
   - Design direction name
   - Color palette (from tailwind.config)
   - Typography choices (font families)
   - Component styling patterns (button styles, card styles, etc.)

## Pages to Generate

Based on `docs/front-end-spec.md` Section 4 (Key Screen Layouts), generate the following pages:

### Core Pages (3 screens)

1. **index.html** - Homepage (already exists, DO NOT OVERWRITE, lines 266-290)
2. **search-results.html** - Search Results (Desktop: lines 329-354, Mobile: lines 360-378)
3. **skill-detail.html** - Skill Detail Page (Desktop: lines 384-421, Mobile: lines 427-446)

### Component Files

Create a shared `components.js` file with all core components from Section 5:

1. SkillCard (lines 469-489)
2. SearchBar (lines 494-514)
3. Button (shadcn/ui base + custom variants, lines 518-537)
4. Badge (lines 542-560)
5. Card (shadcn/ui base, lines 565-579)
6. Table (shadcn/ui base, lines 584-599)
7. Tabs (shadcn/ui base, lines 604-617)
8. MarkdownRenderer (custom component, lines 622-640)
9. CopyButton (custom component, lines 645-659)
10. FilterSidebar (custom component, lines 664-679)

### Navigation Component

Create shared navigation that appears on all pages:

- **Mobile**: Hamburger menu (top-right) with navigation drawer (lines 1013-1022)
- **Tablet**: Hybrid - primary nav in header, secondary in drawer (lines 1023-1028)
- **Desktop/Wide**: Full horizontal navigation bar with search centered (lines 1029-1035)

Navigation includes (from lines 78-85):
- Logo/Home link (left)
- Search bar (center, always visible)
- "Browse" dropdown → Category filters
- "Documentation" link
- "Publish" link
- "GitHub" link (external)

## Technical Requirements

1. **Consistency with Existing Mockup**:
   - Extract color palette from existing `tailwind.config` in `index.html`
   - Reuse font families from existing mockup
   - Match button styles, card styles, and spacing patterns
   - Maintain same design aesthetic throughout

2. **React + shadcn-ui Components**:
   - Use same CDN approach as existing mockup (React, ReactDOM, Babel)
   - Use `mcp__shadcn-ui__get_component_demo` BEFORE `mcp__shadcn-ui__get_component`
   - Inline all component code (no external dependencies)
   - Components needed: Button, Card, Badge, Input, Tabs, Dropdown, Table

3. **Navigation Integration**:
   - All pages include global navigation header (lines 78-85)
   - Navigation highlights current page using aria-current="page"
   - Links between pages use relative paths (e.g., `href="search-results.html"`)
   - Breadcrumb navigation (lines 91-95):
     - Homepage → No breadcrumbs
     - Search Results → "Home / Search: [query]"
     - Skill Detail → "Home / [Category] / [Skill Name]"

4. **Responsive Design**:
   - Mobile-first approach (Mobile: 320-639px, Tablet: 640-1023px, Desktop: 1024-1439px, Wide: 1440px+)
   - Follow responsive patterns from front-end-spec.md Section 9 (lines 962-1102)

5. **Accessibility**:
   - WCAG 2.1 AA compliance (front-end-spec.md Section 7, lines 822-920)
   - Semantic HTML (nav, main, article, aside, footer, header)
   - ARIA labels for icon-only buttons
   - Focus indicators visible (2px solid primary color)
   - Skip-to-content link for keyboard users
   - Keyboard navigation support

6. **Placeholder Content**:
   - Use realistic data matching front-end-spec.md descriptions
   - Skill names: "blockchain-toolkit", "arweave-uploader", "ao-process-manager", etc.
   - Authors: Arweave addresses (abbreviated: abc...xyz format)
   - Categories: "Blockchain", "Documentation", "Arweave", "AO Protocol", "CLI Tools", "AI Workflows"
   - Use https://placehold.co/ for any images (no avatars needed for this registry)

## Execution Steps

1. **Identify Mockup Directory**:
   ```bash
   # Find the mockup directory matching the number
   ls mockups/ | grep "^{mockup_number}-"
   ```

2. **Read Existing Mockup**:
   - Read `mockups/{mockup_number}-{design-name}/index.html`
   - Extract tailwind.config colors, fonts, and styling patterns

3. **Fetch shadcn-ui Components**:
   - For each required component, call `mcp__shadcn-ui__get_component_demo` first
   - Then call `mcp__shadcn-ui__get_component` to get source code
   - Create reusable component library in `components.js`

4. **Generate Pages**:
   - Create each HTML page using the existing mockup's styling
   - Follow exact screen layouts from front-end-spec.md Section 4
   - Include shared navigation component
   - Link pages together with relative URLs

5. **Create Components File**:
   - Write `mockups/{mockup_number}-{design-name}/components.js`
   - Include all 8 core components as React functional components
   - Export components for use in all pages

6. **Create Navigation File**:
   - Write `mockups/{mockup_number}-{design-name}/navigation.js`
   - Include TopNav (desktop/tablet) and BottomNav (mobile) components
   - Include RoleSwitcher component

7. **Update README**:
   - Create/update `mockups/{mockup_number}-{design-name}/README.md`
   - Document all pages and how to navigate between them
   - List all components with usage examples

## Page Template Structure

Each HTML page should follow this structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[Page Title] - Agent Skills Registry - [Design Name]</title>

    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- React CDN -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

    <!-- Babel Standalone -->
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

    <!-- Google Fonts (match existing mockup) -->
    <link href="[FONT_URL_FROM_EXISTING]" rel="stylesheet">

    <!-- Tailwind Custom Config (extracted from existing mockup) -->
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        // Colors from existing mockup
                    }
                }
            }
        }
    </script>
</head>
<body>
    <div id="root"></div>

    <!-- Shared Components -->
    <script type="text/babel" src="./components.js"></script>

    <!-- Navigation Components -->
    <script type="text/babel" src="./navigation.js"></script>

    <!-- Page-Specific Component -->
    <script type="text/babel">
        const { useState, useEffect } = React;

        // Import shared components
        // (components.js exports will be available globally)

        const [PageName] = () => {
            return (
                <div className="min-h-screen">
                    {/* Skip to Content Link (accessibility) */}
                    <a href="#main-content" className="sr-only focus:not-sr-only">
                        Skip to content
                    </a>

                    {/* Global Navigation */}
                    <GlobalNav currentPage="[page-name]" />

                    {/* Breadcrumbs (if applicable) */}
                    <Breadcrumbs path={["Home", "[Current Page]"]} />

                    {/* Main Content */}
                    <main id="main-content" className="container mx-auto px-4 py-8">
                        {/* Screen layout from front-end-spec.md */}
                    </main>

                    {/* Footer */}
                    <Footer />
                </div>
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<[PageName] />);
    </script>
</body>
</html>
```

## Output Format

After generating all pages:

```
✅ Extended Mockup: [Design Direction Name]

📁 Location: /Users/jonathangreen/Documents/Permamind/mockups/[mockup_number]-[design-name]/

📄 Pages Created:
   ✓ search-results.html
   ✓ skill-detail.html

🧩 Components Created:
   ✓ components.js (10 core components)
   ✓ navigation.js (GlobalNav, MobileNav, Breadcrumbs, Footer)

🌐 View Mockups:
   To view the mockups, start a local HTTP server first (required for external JS files):

   cd mockups/[mockup_number]-[design-name] && python3 -m http.server 8000

   Then open in browser:
   Homepage:               http://localhost:8000/index.html
   Search Results:         http://localhost:8000/search-results.html
   Skill Detail:           http://localhost:8000/skill-detail.html

📖 Documentation: mockups/[mockup_number]-[design-name]/README.md
```

## Important Notes

- **DO NOT OVERWRITE** the existing `index.html` (Landing Page)
- **Maintain design consistency** - extract and reuse all styling from existing mockup
- **Follow front-end-spec.md exactly** for screen layouts and component specifications
- **Test navigation** - ensure all pages link together correctly
- **Use realistic placeholder data** - make it look like a real application
- **Ensure mobile responsiveness** - test at all breakpoints (320px, 768px, 1024px, 1440px)
- **Add interactive states** - hover effects, click feedback, active navigation highlighting

## Success Criteria

✅ All 2 new pages created with consistent design aesthetic
✅ Shared components library (components.js) with all 10 core components
✅ Navigation component (navigation.js) with GlobalNav, MobileNav, Breadcrumbs, Footer
✅ Pages link together with relative URLs
✅ Mobile-responsive at all breakpoints (Mobile: 320-639px, Tablet: 640-1023px, Desktop: 1024-1439px, Wide: 1440px+)
✅ Matches screen layouts from front-end-spec.md Section 4
✅ WCAG 2.1 AA compliant (focus indicators, semantic HTML, ARIA labels)
✅ Works with local HTTP server (python3 -m http.server)
✅ README.md documents all pages, components, and how to run the server
