# Claude Agent Skills Registry - Frontend

Web interface for browsing and discovering Claude Agent Skills on the AO Network.

## Tech Stack

- **React 18** - Modern UI library with hooks
- **TypeScript 5.3** - Type-safe development
- **Vite 5** - Lightning-fast dev server and build tool
- **Tailwind CSS v4** - Utility-first CSS with terminal theme
- **shadcn-ui v4** - Accessible, customizable component library
- **@permaweb/aoconnect** - AO Network integration via Randao CU/MU endpoints

## Getting Started

### Prerequisites

- Node.js 20.11.0 LTS or higher
- npm 10.0.0 or higher

### Installation

From the monorepo root:

```bash
npm install
```

### Environment Variables

Copy the example environment file and configure:

```bash
cp frontend/.env.example frontend/.env
```

Default configuration:
- `VITE_REGISTRY_PROCESS_ID` - AO Registry process ID (pre-configured)
- `VITE_CU_URL` - Randao Compute Unit endpoint
- `VITE_MU_URL` - Randao Messaging Unit endpoint

### Development

Start the development server:

```bash
cd frontend
npm run dev
```

Visit http://localhost:5173

### Build

Create a production build:

```bash
npm run build
```

Output directory: `frontend/dist/`

### Testing

Run unit tests with Vitest:

```bash
npm run test          # Watch mode
npm run test:ui       # UI mode
npm run test:coverage # Coverage report
```

#### Integration Tests

Integration tests are **skipped by default** to avoid network dependencies in CI/CD environments. They test real connections to the AO registry process via Randao gateways.

To run integration tests:

```bash
# Enable integration tests
SKIP_INTEGRATION_TESTS=false npm test -- integration

# Or run all tests including integration
SKIP_INTEGRATION_TESTS=false npm test
```

**Note**: Integration tests may take 30-60 seconds due to real network calls to Randao CU/MU endpoints.

### Linting & Formatting

```bash
npm run lint       # Check for issues
npm run lint:fix   # Auto-fix issues
npm run format     # Format code with Prettier
```

## Project Structure

```
frontend/
├── src/
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # Root component
│   ├── components/
│   │   ├── ui/               # shadcn-ui components
│   │   ├── layout/           # Layout components (Header, Footer)
│   │   └── ErrorBoundary.tsx # Error boundary
│   ├── pages/                # Page components
│   │   └── Home.tsx
│   ├── lib/                  # Utilities
│   │   ├── ao-client.ts      # AO client configuration
│   │   └── utils.ts          # Helper functions
│   ├── types/                # TypeScript types
│   │   └── ao.ts             # AO message types
│   ├── test/                 # Test setup
│   │   └── setup.ts
│   ├── index.css             # Tailwind imports
│   └── vite-env.d.ts         # Vite environment types
├── public/                   # Static assets
├── index.html                # HTML entry point
└── dist/                     # Build output
```

## Routing

The application uses **React Router v6** for client-side routing with URL-based state management.

### Routes

| Route | Component | Description | URL Parameters |
|-------|-----------|-------------|----------------|
| `/` | `Home` | Homepage with hero section, featured skills, and categories | None |
| `/search` | `SearchResults` | Search results page with filtering | `?q=<query>&tag=<tag>&author=<author>` |
| `/skills/:name` | Placeholder | Skill detail page (Story 6.5+) | `:name` - Skill name |
| `*` | `NotFound` | 404 error page | None |

### Navigation Helpers

The `lib/navigation.ts` module provides utility functions for constructing navigation URLs:

```typescript
import { navigateToSearch, navigateToSkill, navigateToHome } from '@/lib/navigation';
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Navigate to search results
navigate(navigateToSearch('blockchain'));        // → /search?q=blockchain

// Navigate to search with tag filter
navigate(navigateToSearchByTag('ao'));          // → /search?tag=ao

// Navigate to skill detail
navigate(navigateToSkill('aoconnect'));         // → /skills/aoconnect

// Navigate to homepage
navigate(navigateToHome());                      // → /
```

### Search URL Parameters

Search results support the following URL parameters:

- `q` - Search query text (e.g., `?q=blockchain`)
- `tag` - Filter by tag/category (e.g., `?tag=ao,protocol`)
- `author` - Filter by author (e.g., `?author=Permamind Team`)
- `limit` - Results per page (default: 20)
- `offset` - Pagination offset (default: 0)

**Example URLs:**
- `/search?q=blockchain` - Search for "blockchain"
- `/search?tag=ao` - Filter by "ao" tag
- `/search?q=skills&tag=ao,protocol` - Search with multiple filters

### URL State Management

The `lib/search-utils.ts` module provides utilities for working with search URLs:

```typescript
import { parseSearchParams, buildSearchUrl } from '@/lib/search-utils';
import { useSearchParams } from 'react-router-dom';

// Parse URL parameters
const [searchParams] = useSearchParams();
const query = parseSearchParams(searchParams);
// → { q: 'blockchain', tag: ['ao'], author: 'Permamind Team' }

// Build search URL
const url = buildSearchUrl('test', { tags: ['ao'], author: 'author' });
// → '/search?q=test&tag=ao&author=author'
```

### Active Link Highlighting

The Header component automatically highlights the current page:

- Active links: `text-syntax-green font-semibold`
- Inactive links: `text-terminal-muted hover:text-terminal-text`

### Scroll Behavior

The `ScrollToTop` component automatically scrolls to the top of the page on route changes for better UX.

### Adding New Routes

1. Add route to `src/routes/index.tsx`:

```typescript
import { NewPage } from '@/pages/NewPage';

<Route path="/new-page" element={<NewPage />} />
```

2. Add navigation helper to `src/lib/navigation.ts`:

```typescript
export function navigateToNewPage(id: string): string {
  return `/new-page/${encodeURIComponent(id)}`;
}
```

3. Use in components:

```typescript
const navigate = useNavigate();
navigate(navigateToNewPage('123'));
```

### Troubleshooting

#### Browser back button not working

**Cause**: BrowserRouter not at app root
**Solution**: Ensure `<BrowserRouter>` wraps your entire app in `App.tsx`

#### 404 page not showing

**Cause**: Catch-all route not last in routes array
**Solution**: Ensure `<Route path="*">` is the last route in `AppRoutes`

#### URL not updating on search

**Cause**: Not using navigation helpers
**Solution**: Use `navigate(navigateToSearch(query))` instead of direct path strings

#### Active link highlighting not working

**Cause**: Missing `useLocation()` hook
**Solution**: Import and use `useLocation()` from react-router-dom to detect current route

## Terminal Theme

The app uses a custom dark terminal color scheme:

### Color Palette

- **Background**: `#10151B` (terminal-bg)
- **Surface**: `#1a1f26` (terminal-surface)
- **Border**: `#2d3748` (terminal-border)
- **Text**: `#e2e8f0` (terminal-text)
- **Muted**: `#94a3b8` (terminal-muted)

### Syntax Colors

- **Blue**: `#61afef` (syntax-blue) - Primary accent, links
- **Green**: `#98c379` (syntax-green) - Success, strings
- **Yellow**: `#e5c07b` (syntax-yellow) - Warnings
- **Red**: `#e06c75` (syntax-red) - Errors
- **Purple**: `#c678dd` (syntax-purple) - Operators
- **Cyan**: `#56b6c2` (syntax-cyan) - Constants

### Fonts

- **Body**: Inter (sans-serif)
- **Code**: JetBrains Mono (monospace)

## AO Network Integration

### Overview

The frontend integrates with the AO Registry via `@permaweb/aoconnect` using **read-only `dryrun()` queries** through Randao's gateway infrastructure. All skill data is fetched dynamically from the deployed AO process.

### Service Layer Architecture

```
React Component → Custom Hook → Service Layer → aoconnect dryrun() → Randao Gateway → AO Registry Process
```

#### Service Layer (`src/services/ao-registry.ts`)

Core functions for interacting with the AO registry:

```typescript
import { searchSkills, listSkills, getSkill } from '@/services/ao-registry';

// Search skills by query
const skills = await searchSkills('blockchain');

// List skills with pagination
const result = await listSkills({
  limit: 10,
  offset: 0,
  filterTags: ['ao', 'arweave'],
});

// Get specific skill by name
const skill = await getSkill('my-skill', '1.0.0');
```

#### Custom React Hooks

Three custom hooks provide data fetching with loading states and error handling:

**`useSkillSearch(query: string)`** - Auto-search with 300ms debounce
```typescript
import { useSkillSearch } from '@/hooks/useSkillSearch';

const { skills, loading, error } = useSkillSearch('blockchain');
```

**`useSkillList(options: ListSkillsOptions)`** - Paginated listing
```typescript
import { useSkillList } from '@/hooks/useSkillList';

const { data, loading, error, refetch } = useSkillList({
  limit: 6,
  offset: 0,
});
```

**`useSkill(name: string, version?: string)`** - Single skill fetch
```typescript
import { useSkill } from '@/hooks/useSkill';

const { skill, loading, error } = useSkill('my-skill', '1.0.0');
```

**`useDownloadStats(options)`** - Download statistics (Story 6.15)
```typescript
import { useDownloadStats } from '@/hooks/useDownloadStats';

// Aggregate stats for homepage
const { stats, loading, error } = useDownloadStats({ scope: 'all' });
// → { totalSkills, downloads7Days, downloads30Days, downloadsTotal }

// Per-skill stats for detail page
const { stats, loading, error } = useDownloadStats({ skillName: 'my-skill' });
// → { downloads7Days, downloads30Days, downloadsTotal, skillName }
```

### Download Statistics Feature (Story 6.15)

The frontend displays smart download statistics on both the homepage and skill detail pages, fetched from the AO registry's `Get-Download-Stats` handler.

#### Homepage Aggregate Statistics

The homepage displays three aggregate statistics in a horizontal card layout:

- **Total Skills**: Count of all registered skills
- **Downloads · Last Week**: Sum of all downloads in past 7 days
- **Downloads · Last Month**: Sum of all downloads in past 30 days

**Implementation:**
```typescript
// src/components/sections/StatsSection.tsx
import { useDownloadStats } from '@/hooks/useDownloadStats';

export function StatsSection() {
  const { stats, loading, error } = useDownloadStats({ scope: 'all' });
  // Displays 3 cards with totalSkills, downloads7Days, downloads30Days
}
```

**Features:**
- Loading skeletons during data fetch
- Graceful error handling (hides section on error)
- Terminal theme styling with badge-style cards
- Responsive design (stacks vertically on mobile)

#### Skill Detail Page Smart Statistics

The skill detail page shows the **2 most relevant** download metrics for each skill using smart display logic:

**Display Rules:**
- **Popular skills** (≥100 downloads): Show "Total Downloads" + "Last Week"
- **New skills** (<30 days, <100 downloads): Show best 2 metrics based on activity
- **Active skills** (downloads in last 7 days): Show "Last Week" + "Total Downloads"
- **Default**: Show "Total Downloads" + "Last Month"

**Implementation:**
```typescript
// src/lib/smartDownloadStats.ts
export function getSmartDownloadStats(
  skill: SkillMetadata,
  stats: DownloadStats
): StatDisplay[] {
  // Returns array of 2 most relevant metrics
  // Example: [
  //   { label: "Total Downloads", value: 500, tooltip: "All time" },
  //   { label: "Last Week", value: 45, tooltip: "Past 7 days" }
  // ]
}
```

**Thresholds:**
- `POPULAR_DOWNLOADS`: 100
- `NEW_SKILL_DAYS`: 30
- `ACTIVE_RECENT_DAYS`: 7

#### Service Layer Integration

Download statistics are fetched via the same service layer as other AO registry queries:

```typescript
// src/services/ao-registry.ts
export async function getDownloadStats(
  options: { scope: 'all' } | { skillName: string },
  retries = 3
): Promise<DownloadStats | null> {
  // Fetches from AO registry Get-Download-Stats handler
  // Implements retry logic and HTML error response detection
}
```

**Error Handling:**
- Validates response structure before parsing
- Detects HTML error responses from CU
- Retry logic with exponential backoff (2s, 4s, 8s)
- Graceful degradation (returns null on error)
- 5-minute cache TTL

#### Component API

**`SmartStatsDisplay`** - Renders smart stats badges for skill detail page
```typescript
import { SmartStatsDisplay } from '@/components/SmartStatsDisplay';

<SmartStatsDisplay skill={skill} />
// Renders 2 badge-style stat displays (green/cyan variants)
// Falls back to simple download count on error
```

**`StatsSection`** - Renders aggregate stats for homepage
```typescript
import { StatsSection } from '@/components/sections/StatsSection';

<StatsSection />
// Renders 3 stat cards with icons
// Hides section gracefully on error
```

### Randao Gateway Configuration

The app connects via Randao's reliable gateway infrastructure:

- **CU (Compute Unit)**: https://ur-cu.randao.net
- **MU (Messaging Unit)**: https://ur-mu.randao.net
- **Registry Process ID**: `RMIivqgsdvZobdv6ekkPIicDmX-925VcnivRzRFv_TQ`

Configuration in `src/lib/ao-client.ts`:
```typescript
import { dryrun } from '@permaweb/aoconnect';

export const REGISTRY_PROCESS_ID =
  import.meta.env.VITE_REGISTRY_PROCESS_ID ||
  'RMIivqgsdvZobdv6ekkPIicDmX-925VcnivRzRFv_TQ';

export { dryrun };
```

### Error Handling & Retry Logic

The service layer implements robust error handling for common Randao gateway issues:

#### Common Errors

1. **Network Timeouts (30-45 seconds)**
   - Randao endpoints can take 30-45 seconds to respond
   - Service layer implements 45-second timeout
   - Shows loading indicator after 10 seconds: "Still loading..."

2. **HTML Error Responses**
   - CU sometimes returns HTML on error instead of JSON
   - Service checks `Content-Type` header before parsing
   - Displays user-friendly message: "Gateway temporarily unavailable"

3. **Malformed JSON**
   - All JSON parsing wrapped in try-catch
   - Validates response structure before accessing fields
   - Logs raw response for debugging (dev only)

4. **Empty Messages Array**
   - Checks `Messages` array exists and has length > 0
   - Throws error: "No response from registry process"

#### Retry Logic with Exponential Backoff

```typescript
// Automatic retry with exponential backoff
// Retry delays: 2s → 4s → 8s (3 attempts total)
const result = await listSkills({ limit: 10 });
```

Implementation details:
- **Max retries**: 3 attempts
- **Delays**: 2s, 4s, 8s (exponential backoff)
- **Total timeout**: ~14 seconds + 3× query time
- **Caching**: 5-minute TTL to reduce redundant queries

### Caching Strategy

Query results are cached for 5 minutes to reduce load on Randao gateway:

```typescript
// First call - hits AO registry
const skills1 = await searchSkills('blockchain');

// Within 5 minutes - uses cache (instant)
const skills2 = await searchSkills('blockchain');

// After 5 minutes - refreshes from AO registry
const skills3 = await searchSkills('blockchain');
```

Cache behavior:
- **TTL**: 5 minutes
- **Storage**: In-memory (cleared on page reload)
- **Key**: Query parameters (action + tags)
- **Invalidation**: Manual refetch via `refetch()` function

### Loading States & UI Feedback

#### LoadingSkeleton Component

Shimmer animation matching SkillCard dimensions:

```typescript
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

<LoadingSkeleton variant="skill-card" />
```

#### LoadingSpinner Component

Rotating blue spinner for inline loading:

```typescript
import { LoadingSpinner } from '@/components/LoadingSpinner';

<LoadingSpinner size="md" label="Fetching skills..." />
```

#### ErrorMessage Component

Terminal-themed error display with retry button:

```typescript
import { ErrorMessage } from '@/components/ErrorMessage';

<ErrorMessage
  message="Failed to load skills"
  onRetry={() => refetch()}
  variant="error"
/>
```

### Security Measures

- **Input Validation**: Search queries sanitized and length-limited
- **Response Validation**: Checks response structure before accessing fields
- **JSON Parsing**: All parsing wrapped in try-catch
- **Error Messages**: Never expose stack traces or process IDs in UI
- **Rate Limiting**: Client-side debouncing (300ms) and caching
- **TypeScript**: Compile-time type safety for all AO messages
- **No dangerouslySetInnerHTML**: All content rendered safely

### Troubleshooting AO Integration

#### "No skills loading" / Blank featured section

1. **Check network tab**: Verify dryrun requests are being made
2. **Inspect response**: Look for HTML errors or malformed JSON
3. **Try manual query**: Test with `listSkills()` in console
4. **Check process ID**: Verify `VITE_REGISTRY_PROCESS_ID` is correct

```bash
# Check environment variable
echo $VITE_REGISTRY_PROCESS_ID

# Should output: RMIivqgsdvZobdv6ekkPIicDmX-925VcnivRzRFv_TQ
```

#### "Network timeout" errors

- **Normal**: Randao can take 30-45 seconds on first query
- **Solution**: Wait for loading to complete
- **Workaround**: Refresh page to clear cache and retry

#### "HTML error from CU" errors

- **Cause**: Randao CU returning HTML error page
- **Solution**: Retry automatically (exponential backoff)
- **Manual fix**: Click retry button in error message

#### Search not returning results

1. **Check query length**: Must be 2+ characters
2. **Wait for debounce**: 300ms delay after typing
3. **Verify autocomplete**: Check dropdown appears
4. **Console errors**: Look for JavaScript errors

#### Integration test failures

```bash
# Skip real AO calls in CI
SKIP_INTEGRATION_TESTS=true npm test

# Run with real AO registry (slow, 60s timeout)
npm test -- ao-registry.test.tsx
```

## Troubleshooting

### Port Already in Use

If port 5173 is in use:

```bash
# Kill the process
lsof -ti:5173 | xargs kill

# Or use a different port
vite --port 3000
```

### Tailwind Classes Not Working

Ensure Tailwind v4 PostCSS plugin is installed:

```bash
npm install -D @tailwindcss/postcss
```

### TypeScript Errors

Verify tsconfig.json includes:
- `jsx: "react-jsx"`
- `moduleResolution: "bundler"`
- Include Vite environment types

### Build Errors

Clear cache and rebuild:

```bash
rm -rf dist node_modules/.vite
npm run build
```

## License

MIT

## Advanced UI Components (Story 6.4)

### Tabs Component Family

Tabbed navigation with CLI theme variants.

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

<Tabs defaultValue="overview">
  <TabsList variant="cli">
    <TabsTrigger value="overview" variant="cli" icon="📄" count={5}>
      Overview
    </TabsTrigger>
    <TabsTrigger value="details" variant="cli">Details</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">Content here</TabsContent>
  <TabsContent value="details">More content</TabsContent>
</Tabs>
```

**Variants:** `default`, `cli`, `underline`, `window`, `pills`

### Table Component Family

Terminal-styled tables for data display.

```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Version</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>arweave</TableCell>
      <TableCell>^1.14.0</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### CopyButton

Clipboard copy with visual feedback.

```tsx
import { CopyButton } from '@/components/CopyButton'

<CopyButton text="npm install @permamind/skills" />
```

Shows checkmark for 2 seconds after copying.

### Breadcrumbs

Semantic breadcrumb navigation.

```tsx
import { Breadcrumbs } from '@/components/Breadcrumbs'

<Breadcrumbs path={['search', 'aoconnect']} />
// Renders: home / search / aoconnect
```

### MarkdownRenderer

Basic markdown parser with XSS prevention.

```tsx
import { MarkdownRenderer } from '@/components/MarkdownRenderer'

<MarkdownRenderer content="# Title\n\n**Bold** and `code`" />
```

**Supported:** Headers (h1-h3), bold, inline code, paragraphs

## Homepage Sections (Story 6.5)

### Hero Section

Animated gradient heading with search bar integration.

**Features:**
- Animated gradient heading (blue → cyan → green color shift)
- 5-second animation loop with smooth ease-in-out timing
- Search bar with autocomplete dropdown
- Dark terminal background (#10151B)

**Animation Keyframes:**
```css
@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
```

### How It Works Section

3-column grid explaining the skill discovery workflow.

**Card Structure:**
- **Numbered icons**: Circle badges (1, 2, 3) in blue/green/purple
- **Titles**: `$ discover`, `$ install`, `$ activate`
- **Descriptions**: Step-by-step workflow explanation
- **Responsive**: Stacks vertically on mobile (375px), 3-column grid on desktop (1440px)
- **Hover effects**: Scale (1.05) and shadow on hover

### Quick Start Section

Terminal-styled code block with CopyButton integration.

**Features:**
- Terminal background with border styling
- Green `$` prompt with install command
- Positioned CopyButton (top-right corner)
- Centered layout with max-width constraint
- Copy-to-clipboard functionality with visual feedback

**Example:**
```tsx
<QuickStartSection />
// Renders: $ npm install -g skills [Copy Button]
```

### Section Order

Full homepage layout (top to bottom):
1. **Header** - Navigation with Home/Search links
2. **Hero** - Animated gradient heading + search bar
3. **Feature Cards** - Decentralized Registry + Easy Integration
4. **Featured Skills** - 3 skill cards grid (from AO registry)
5. **Categories** - 6 category badges (clickable filters)
6. **How It Works** - 3 numbered cards (discover/install/activate)
7. **Quick Start** - Terminal block with install command
8. **Footer** - Arweave badge + links

## Animations & Polish (Story 6.5)

### Gradient Heading Animation

**CSS Details:**
- **Duration**: 5 seconds
- **Timing**: ease-in-out (smooth acceleration/deceleration)
- **Loop**: Infinite
- **Colors**: Blue (#61afef) → Cyan (#56b6c2) → Green (#98c379)
- **Gradient angle**: 135deg diagonal
- **Background size**: 200% 200% (allows smooth position animation)

**Browser Compatibility:**
- Uses `-webkit-background-clip: text` for gradient text effect
- Fallback: Solid cyan color for unsupported browsers

### Smooth Scroll Behavior

**Implementation:**
```css
html {
  scroll-behavior: smooth;
}

/* Respect user's reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}
```

**Features:**
- Smooth scroll on anchor links and page navigation
- Respects user accessibility preferences (prefers-reduced-motion)
- Works with ScrollToTop component for route changes

### Card Hover Effects

**SkillCard:**
- Border color: terminal-border → syntax-blue
- Shadow: `0 0 20px rgba(96,165,250,0.3)` glow effect
- Transition: 300ms duration

**HowItWorksSection Cards:**
- Scale: 1 → 1.05 on hover
- Shadow: `shadow-lg shadow-syntax-blue/10`
- Transition: 300ms all properties

**Category Badges:**
- Scale: 1 → 1.05 on hover
- Border: terminal-border → syntax-cyan
- Transition: all properties

### CopyButton Animation

**States:**
- **Default**: Clipboard icon, muted text color
- **Hover**: Terminal text color, surface background
- **Copied**: Green checkmark icon, syntax-green color
- **Duration**: Shows "Copied!" state for 2 seconds

## Performance Optimization (Story 6.5)

### Code Splitting

Route-based code splitting implemented with React.lazy() and Suspense.

**Bundle Sizes (Gzipped):**
- **Initial bundle**: 68.35 KB (index chunk)
- **Home route**: 3.88 KB (lazy loaded)
- **SearchResults route**: 1.46 KB (lazy loaded)
- **SkillDetail route**: 8.39 KB (lazy loaded)

**Implementation:**
```tsx
// routes/index.tsx
const Home = lazy(() => import('@/pages/Home'));
const SearchResults = lazy(() => import('@/pages/SearchResults'));
const SkillDetail = lazy(() => import('@/pages/SkillDetail'));

<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/" element={<Home />} />
    {/* ... */}
  </Routes>
</Suspense>
```

**Benefits:**
- 94% reduction in initial bundle size (from 1 MB to 68 KB gzipped)
- Faster Time to Interactive (TTI) on 3G networks
- On-demand loading of route-specific code

### Lazy Loading

**Route Components:**
- Only loaded when user navigates to that route
- LoadingSpinner shown during chunk download
- Chunks cached by browser after first load

**Performance Targets:**
- **Initial bundle**: <100 KB gzipped ✅ (68.35 KB)
- **Time to Interactive**: <3 seconds on 3G ✅
- **First Contentful Paint**: <1.5 seconds ✅
- **Lighthouse Score**: >90 Performance ✅

### Build Optimization

**Vite Configuration:**
- Tree-shaking for unused code elimination
- Minification with esbuild (fastest minifier)
- CSS extraction and purging (Tailwind)
- Source maps for debugging (dev only)

**Bundle Analysis:**
```bash
npm run build
# Check dist/assets/ for chunk sizes
```

### Caching Strategy

**React Query (useSkillList, useSkillSearch, useSkill):**
- **TTL**: 5 minutes
- **Storage**: In-memory cache
- **Invalidation**: Manual via refetch()

**Browser Caching:**
- JS chunks: Hashed filenames (cache-busting)
- CSS: Hashed filename (cache-busting)
- Static assets: Served with cache headers

## Responsive Design (Story 6.5)

### Breakpoints

Tested and optimized at three viewport sizes:

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| **Mobile** | 375px | Single column, stacked cards, horizontal scroll for categories |
| **Tablet** | 768px | 2-column grids, stacked navigation |
| **Desktop** | 1440px | 3-column grids (How It Works), 6-column categories, full layout |

### Mobile-Specific Optimizations

**Categories Section:**
- Horizontal scrollable on mobile (`overflow-x-auto`)
- Grid layout on tablet/desktop (`md:grid md:grid-cols-3`)

**How It Works Cards:**
- Stack vertically on mobile (`grid-cols-1`)
- 3-column grid on desktop (`md:grid-cols-3`)

**Quick Start Terminal:**
- Constrained width on all devices (`max-w-2xl mx-auto`)
- Horizontal padding prevents overflow (`px-4`)

### Testing Responsive Layouts

**Playwright Tests:**
```bash
# Run responsive tests
npm run test:e2e

# Manual testing with Playwright tools:
mcp__playwright__browser_resize: 375x667 (mobile)
mcp__playwright__browser_resize: 768x1024 (tablet)
mcp__playwright__browser_resize: 1440x900 (desktop)
```

**Browser DevTools:**
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select preset devices or enter custom dimensions
4. Test interactions (hover, click, scroll)

## Troubleshooting (Story 6.5)

### Gradient Animation Not Working

**Symptom**: Heading shows solid color instead of animated gradient

**Causes:**
- Browser doesn't support `-webkit-background-clip: text`
- CSS not loaded or cached incorrectly

**Solutions:**
```bash
# Clear cache and rebuild
rm -rf dist node_modules/.vite
npm run dev
```

### Smooth Scroll Not Working

**Symptom**: Page jumps instead of smooth scrolling

**Causes:**
- CSS `scroll-behavior: smooth` not applied to `html` element
- User has `prefers-reduced-motion: reduce` set

**Solutions:**
- Inspect `html` element in DevTools → Computed → `scroll-behavior` should be `smooth`
- Check browser accessibility settings

### CopyButton Not Copying

**Symptom**: Clicking copy button doesn't copy text to clipboard

**Causes:**
- Requires HTTPS (or localhost) for Clipboard API
- Browser permissions denied

**Solutions:**
- Run on localhost for development
- Check browser console for permission errors
- Grant clipboard permissions in browser settings

### Lazy Loading Chunks Not Loading

**Symptom**: LoadingSpinner shows indefinitely, route not loading

**Causes:**
- Network error during chunk download
- Chunk file missing from dist/

**Solutions:**
```bash
# Rebuild to regenerate chunks
npm run build

# Check dist/assets/ for chunk files
ls -lh dist/assets/

# Verify chunks exist:
# - Home-*.js
# - SearchResults-*.js
# - SkillDetail-*.js
```

**Network Tab Inspection:**
1. Open DevTools → Network tab
2. Navigate to route
3. Look for lazy chunk requests (e.g., `Home-Cmz4dC2J.js`)
4. Check HTTP status (should be 200)

## Troubleshooting

- **Clipboard not working**: Requires HTTPS (or localhost). Check browser permissions.
- **Tabs not switching**: Verify `defaultValue` matches a tab `value` prop.
- **Table overflow on mobile**: Component includes `overflow-x-auto` wrapper automatically.
