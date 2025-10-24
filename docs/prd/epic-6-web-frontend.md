# Epic 6: Web Frontend

**Epic Goal:**
Build a production-ready web frontend for the Agent Skills Registry that enables developers to discover, browse, and learn about agent skills through an intuitive terminal-themed interface, complementing the existing CLI tool with visual exploration capabilities. By the end of this epic, users can search, browse skills visually, view detailed skill information, and efficiently filter results, completing the visual discovery experience alongside the existing CLI workflows.

## Story 6.1: Project Setup and Core Components

**As a** frontend developer,
**I want** a properly configured React + TypeScript project with shadcn-ui components,
**So that** I have a solid foundation for building the web frontend with terminal-themed styling.

**Acceptance Criteria:**
1. React + TypeScript project initialized with Vite build tool
2. shadcn-ui installed with terminal color theme configuration (`#10151B` background, syntax colors)
3. Tailwind CSS configured with custom color palette from front-end-spec (terminal, syntax, accent colors)
4. Project structure created: `src/components/`, `src/pages/`, `src/lib/`, `src/types/`
5. ESLint + Prettier configured with accessibility linting (jsx-a11y plugin)
6. shadcn-ui core components installed: Button, Card, Badge, Input, Skeleton
7. SkillCard component created with terminal-themed styling (320px × 240px, hover effects, gradient border)
8. Global Header component (sticky, backdrop blur) with logo, navigation links
9. Footer component with "Powered by Arweave & AO" badge and documentation links
10. Build succeeds with no TypeScript errors or linting warnings
11. Responsive design tested: Mobile (320px), Tablet (768px), Desktop (1440px) viewports render correctly

## Story 6.2: AO Registry Integration Layer

**As a** frontend developer,
**I want** @permaweb/aoconnect integration with React Query for AO registry queries,
**So that** I can fetch and cache skill data efficiently from the decentralized registry.

**Acceptance Criteria:**
1. @permaweb/aoconnect installed and configured with registry process ID from environment
2. aoconnect configured with randao CU and MU URLs:
   - CU_URL: `https://ur-cu.randao.net`
   - MU_URL: `https://ur-mu.randao.net`
   - Environment variable override support: `VITE_AO_CU_URL` and `VITE_AO_MU_URL` (optional)
3. React Query (@tanstack/react-query) installed and QueryClientProvider configured
4. AO client module created: `src/lib/aoClient.ts` with:
   - dryrun wrapper functions
   - connect() configured with randao CU/MU URLs
   - Environment variable override support (VITE_AO_CU_URL, VITE_AO_MU_URL)
5. useSearchSkills hook: Queries Search-Skills handler with debounced input (300ms)
6. useListSkills hook: Queries List-Skills handler with pagination (limit, offset) and filtering (FilterTags, Author, FilterName)
7. useSkillDetail hook: Queries Get-Skill handler with skill name parameter
8. useSkillVersions hook: Queries Get-Skill-Versions handler
9. React Query caching: 5-minute stale time, stale-while-revalidate strategy
10. Error handling: Retry logic (3 attempts, exponential backoff), error toast notifications
11. Loading states: isLoading and isFetching states exposed from hooks
12. Unit tests for all hooks with mocked AO responses

## Story 6.3: Homepage Hero and Search

**As a** developer exploring agent skills,
**I want** a homepage with search functionality and autocomplete,
**So that** I can quickly discover skills by typing queries.

**Acceptance Criteria:**
1. Homepage route created at `/` with hero section layout
2. Hero heading: "Discover Agent Skills for Claude" with shimmer gradient animation
3. Hero subheading: Value proposition text with terminal-muted color
4. SearchBar component with terminal `$` prompt prefix and autofocus
5. Search input placeholder: "search skills --query blockchain"
6. Autocomplete dropdown triggers after 3 characters, shows max 5 suggestions
7. Autocomplete queries AO registry via useSearchSkills hook (debounced 300ms)
8. Keyboard navigation: ↑↓ arrows navigate suggestions, Enter selects, ESC closes
9. Cmd/Ctrl+K keyboard shortcut focuses search from anywhere
10. Clear button (X icon) appears when input has text
11. Quick-start terminal code block with macOS traffic lights (red/yellow/green dots)
12. Terminal code block displays install CLI command
13. Playwright E2E test: Type in search → see autocomplete → select suggestion → navigate to results

## Story 6.4: Featured Skills and Categories

**As a** developer browsing the ecosystem,
**I want** to see featured skills and browse by category,
**So that** I can discover popular skills without searching.

**Acceptance Criteria:**
1. Featured skills section with heading: "// featured_skills" (syntax-purple comment style)
2. 3-column grid (desktop), 2-column (tablet), 1-column (mobile) using SkillCard component
3. Featured skills loaded via useListSkills hook (limit: 6, offset: 0)
4. "view all →" link navigates to search results page showing all skills
5. Loading state: 6 SkillCard skeleton placeholders
6. Categories section with heading: "// browse_by_category"
7. 6-column grid (desktop), 3-column (tablet), 2-column (mobile) for category badges
8. Categories: blockchain, documentation, arweave, ao-protocol, cli-tools, ai-workflows with skill counts
9. Category badges clickable, navigate to `/search?category=[name]`
10. Terminal-border hover effect on category cards
11. How It Works section with 3 cards: "1. $ discover", "2. $ install", "3. $ activate"
12. Numbered icons (48px circles) with syntax color backgrounds (blue/green/purple)
13. Playwright E2E test: Click featured skill → navigate to detail page
14. Playwright E2E test: Click category badge → navigate to filtered search results

## Story 6.5: Skill Detail Page - Overview Tab

**As a** developer evaluating a skill,
**I want** to view comprehensive skill information on a detail page,
**So that** I can understand what the skill does before installing.

**Acceptance Criteria:**
1. Skill detail page route created: `/skill/:skillName`
2. Page header (sticky): Skill name (H1, mono-gradient), author with abbreviated Arweave address (abc...xyz)
3. Metadata badges: Version (green), License (gray), Published date
4. Breadcrumb navigation: "Home / [Category] / [Skill Name]"
5. Action bar (sticky): "Install via CLI" button copies `agent-skills install <name>` command
6. Toast notification on copy: "Copied! Run this in your terminal" (2s duration)
7. "View on Arweave" button opens `https://arweave.net/{txId}` in new tab
8. Share icon button copies page URL to clipboard
9. Tabs navigation: "Overview" | "Dependencies" | "Versions" using shadcn Tabs
10. Overview tab displays: Full description, clickable tag badges (navigate to filtered search)
11. "Quick Start" code block with install command and copy button
12. Copy button: Clipboard icon → Checkmark on success (2s timeout)
13. Skill metadata loaded via useSkillDetail hook (Get-Skill handler)
14. Download tracking: Send Record-Download message on "Install" button click
15. 404 page if skill not found
16. Playwright E2E test: Navigate to skill detail → verify Overview content → copy install command → verify toast

## Story 6.6: Skill Detail Page - Dependencies and Versions Tabs

**As a** developer evaluating a skill,
**I want** to view dependency tree and version history,
**So that** I can assess compatibility and upgrade paths.

**Acceptance Criteria:**
1. Dependencies tab displays tree view component with recursive hierarchy
2. Each dependency: Name (clickable link to skill detail), Version badge (green)
3. Nested dependencies shown with indentation, collapsible nodes (expand/collapse icon)
4. Dependencies loaded recursively via useSkillDetail hook for each dependency
5. Empty state: "No dependencies" with checkmark icon (syntax-green)
6. Versions tab displays table: Version | Published Date | Arweave TXID | Actions
7. Latest version has "Latest" badge (green, bold)
8. Published date format: "Jan 22, 2025" (human-readable)
9. Arweave TXID abbreviated (abc...xyz) with copy button
10. Actions column: "View on Arweave" link (opens new tab)
11. Versions sorted descending (latest first)
12. Version history loaded via useSkillVersions hook (Get-Skill-Versions handler)
13. Changelog support: If `changelog` field exists, display in expandable row
14. Mobile: Table converts to card layout (no horizontal scroll)
15. Hash routing: URL updates on tab change (#overview, #dependencies, #versions)
16. Keyboard navigation: Left/Right arrow keys switch tabs
17. Playwright E2E test: Switch to Dependencies tab → click dependency → navigate to dependency detail
18. Playwright E2E test: Switch to Versions tab → verify version history → copy TXID

## Story 6.7: Skill Detail Page - Sidebar and Mobile Layout

**As a** developer on desktop or mobile,
**I want** contextual metadata displayed appropriately for my device,
**So that** I can access key information without excessive scrolling.

**Acceptance Criteria:**
1. Right sidebar (desktop, 30% width, sticky): Statistics card, Author card, Tags card, Install instructions card
2. Statistics card displays: Download count, Dependencies count
3. Author card displays: Author name, abbreviated Arweave address with copy button, "View all by author" link
4. Tags card: All tags as clickable badges (max 10 visible, "+X more" badge if exceeds)
5. Install instructions card: Copy-pasteable command with terminal styling
6. Mobile layout (< 1024px): No sidebar, statistics/author/tags sections inline within Overview tab
7. Mobile action bar: Fixed at bottom, full-width buttons (Install, View on Arweave) stacked
8. Mobile header: Back button navigates to previous page or homepage
9. Responsive breakpoint: Sidebar visible ≥ 1024px, hidden < 1024px
10. Playwright E2E test: Desktop viewport → verify sidebar visible
11. Playwright E2E test: Mobile viewport → verify sidebar hidden, action bar at bottom

## Story 6.8: Search Results Page with Basic Filtering

**As a** developer searching for skills,
**I want** to view search results in a grid with basic category filtering,
**So that** I can browse and narrow down results efficiently.

**Acceptance Criteria:**
1. Search results page route created: `/search` with query parameter support
2. Results header displays: "X skills found for '[query]'" (left-aligned)
3. If no query: Display "All Skills" or "[Category] Skills"
4. Main results area: 2-column grid (desktop), 1-column (mobile)
5. Results display 12 skills per page using SkillCard component
6. Results loaded via useListSkills hook (Limit: 12, Offset: page-based)
7. Filter sidebar (desktop, 25% width, sticky) with category checkboxes
8. Category checkboxes: Multi-select (blockchain, documentation, arweave, ao-protocol, cli-tools, ai-workflows)
9. Each category shows count badge: "blockchain (42)"
10. Selecting category updates results instantly (no "Apply" button)
11. Active filters shown as dismissible badges: "blockchain ×" with click to remove
12. "Clear all filters" link visible when filters active
13. URL state: Category filter persists in query param (?category=blockchain)
14. Category browsing from homepage: Clicking category navigates with pre-filled filter
15. Loading state: 6 SkillCard skeleton placeholders
16. Empty state: "No skills found" with "Try removing filters" button
17. Playwright E2E test: Homepage → click category → see filtered results
18. Playwright E2E test: Select category checkbox → see filter badge → click dismiss → filter removed

## Story 6.9: Search Results - Advanced Filtering and Sorting

**As a** developer refining my search,
**I want** to filter by author and sort results by different criteria,
**So that** I can find the most relevant skills efficiently.

**Acceptance Criteria:**
1. Filter sidebar includes "Filter by Author" text input (debounced 500ms)
2. Author filter: Case-insensitive substring matching (e.g., "arweave" matches "arweave-core")
3. Author filter updates URL query parameter (?author=arweave-core)
4. Sort dropdown (shadcn Select, right-aligned in results header)
5. Sort options: "Relevance", "Most Popular", "Recently Updated", "A-Z"
6. Sort implementations: Relevance (text similarity if query), Most Popular (downloadCount desc), Recently Updated (updatedAt desc), A-Z (name alphabetical)
7. Changing sort updates URL query parameter (?sort=popular)
8. Sort changes: Instant if data cached (client-side), otherwise re-query AO registry
9. Combined filters: Category AND author filters work together (AND logic across filter types)
10. Tag filtering from skill detail: Clicking tag navigates to `/search?tags=blockchain`
11. Multiple filters: Active filter badges show all applied filters
12. Filters debounced (500ms for text inputs) to prevent excessive AO queries
13. Playwright E2E test: Type in author filter → results update → see author badge
14. Playwright E2E test: Change sort dropdown → results reorder

## Story 6.10: Search Results - Pagination and Mobile Filtering

**As a** developer browsing many results,
**I want** pagination controls and mobile-friendly filtering,
**So that** I can navigate large result sets efficiently on any device.

**Acceptance Criteria:**
1. Pagination component displays: Page numbers (1 2 3 ... 10, max 7 visible), Previous/Next buttons, "Page X of Y" text
2. Pagination controls at bottom of results grid
3. Clicking page number scrolls to top and loads that page
4. Previous/Next buttons disabled at first/last page boundaries
5. Page number updates URL query parameter (?page=2)
6. Mobile pagination: Hide page numbers, show only prev/next arrows
7. AO List-Skills Offset calculation: (page - 1) × 12
8. Pagination metadata from AO: total, hasNextPage, hasPrevPage
9. Filter drawer (mobile): Slides from bottom, backdrop overlay, triggered by "Filter" button
10. Filter button badge shows active filter count: "Filter (3)"
11. Drawer content: Category checkboxes, Author input, "Apply Filters" button, "Clear All" link
12. Swipe down gesture closes drawer, clicking backdrop closes drawer, ESC key closes drawer
13. Drawer: role="dialog", aria-modal="true", proper focus management
14. Desktop filters update instantly, mobile filters apply on "Apply Filters" button click
15. URL state management: Browser back/forward navigation restores filter state, shareable URLs work
16. Playwright E2E test: Pagination → click page 2 → scroll to top → see new results
17. Playwright E2E test: Mobile filter drawer → open → apply filters → close → see filtered results

## Story 6.11: Performance Optimization and Accessibility Polish

**As a** user with accessibility needs or slow network,
**I want** a fast, accessible web interface,
**So that** I can use the registry regardless of my abilities or connection speed.

**Acceptance Criteria:**
1. Lighthouse Performance audit: Score ≥ 90, First Contentful Paint < 1.5s on 3G
2. Bundle size analysis: Total gzipped JavaScript < 150KB
3. Code splitting: MarkdownRenderer and DependencyTree dynamically imported
4. Font loading: font-display: swap, Inter and JetBrains Mono preloaded
5. Image optimization: Lazy loading for below-the-fold images
6. React.memo applied to SkillCard component (prevents unnecessary re-renders)
7. Accessibility audit: axe DevTools scan passes with 0 violations
8. Keyboard navigation: Tab through all interactive elements, visible focus indicators (2px blue ring)
9. ARIA labels: Icon-only buttons, toast notifications (aria-live="polite"), tab panels
10. Screen reader support: Semantic HTML (<nav>, <main>, <article>, <aside>, <footer>)
11. Color contrast: All text meets WCAG 2.1 AA (4.5:1 minimum), verified with axe DevTools
12. prefers-reduced-motion: Animations disabled for users with motion sensitivity
13. Touch targets: Minimum 44px × 44px on mobile for all interactive elements
14. Responsive reflow: All content accessible at 200% zoom without horizontal scrolling
15. Performance testing: Measure filter change response time < 500ms, sort change instant with cache
16. Playwright accessibility tests: Keyboard-only navigation through all user flows
