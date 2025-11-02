# Epic 6: Developer CLI Frontend - Brownfield Enhancement

**Epic Type:** Brownfield Enhancement
**Scope:** Medium (7 stories)
**Risk Level:** Low
**Status:** Draft

---

## Epic Goal

Convert the existing developer-cli static mockup into a production-ready React application that displays real skill data from the deployed AO registry process (`RMIivqgsdvZobdv6ekkPIicDmX-925VcnivRzRFv_TQ`) using `@permaweb/aoconnect` with Randao CU/MU endpoints, providing users with a polished web interface for browsing and discovering Claude Agent Skills.

---

## Epic Description

### Existing System Context

**Current relevant functionality:**
- Fully functional AO registry process deployed with process ID `RMIivqgsdvZobdv6ekkPIicDmX-925VcnivRzRFv_TQ`
- Static HTML mockup in `mockups/developer-cli` demonstrating desired UI/UX with terminal-themed design
- Monorepo structure with workspace-based CLI tooling
- aoconnect skill already available with documentation
- Randao CU/MU configuration for Epic 6

**Technology stack:**
- React (to be migrated from CDN to proper workspace)
- TypeScript (existing in CLI workspace, to be used for frontend)
- Tailwind CSS (existing in mockup)
- shadcn-ui v4 components (to be properly integrated)
- Vite (build tool for modern React apps)
- **@permaweb/aoconnect** - AO JavaScript SDK
- **Randao CU/MU endpoints** (`https://ur-cu.randao.net`, `https://ur-mu.randao.net`)

**Integration points:**
- AO registry process via `@permaweb/aoconnect` dryrun queries
- Message handlers: `Search-Skills`, `List-Skills`, `Get-Skill`, `Get-Skill-Versions`
- Randao gateway configuration for reliability and performance
- Workspace integration with existing CLI tooling

### Enhancement Details

**What's being added/changed:**

1. Create new `frontend/` workspace in monorepo
2. Convert static HTML mockup to proper React/TypeScript application
3. Integrate `@permaweb/aoconnect` with Randao CU/MU configuration
4. Implement dryrun queries for read-only data access
5. Implement shadcn-ui v4 component library properly
6. Add routing for multi-page functionality (home, search, skill detail)
7. Configure Vite for development and production builds

**How it integrates:**

- Frontend workspace operates independently from CLI workspace
- Uses `@permaweb/aoconnect` dryrun for read-only queries (no wallet required)
- Configured with Randao CU/MU URLs for reliable gateway access
- No changes to existing AO process or CLI tools required
- Uses existing registry message handlers and schema

**Success criteria:**

- React app runs locally with `npm run dev`
- Real skills data displayed from AO registry via aoconnect
- Randao CU/MU endpoints configured and functional
- Search, filtering, and navigation functional
- Responsive design working across viewports
- Production build ready for ArNS deployment
- All existing CLI and AO process functionality intact

---

## Stories

### Story 6.1: Frontend Workspace Setup & Build Infrastructure

Set up the frontend workspace with proper React/TypeScript/Vite configuration, Tailwind CSS, shadcn-ui v4 integration, and `@permaweb/aoconnect` with Randao CU/MU configuration.

**Acceptance Criteria:**

- `frontend/` workspace created with proper package.json
- Vite configured for React/TypeScript development
- Tailwind CSS configured with mockup color scheme
- shadcn-ui v4 components initialized
- `@permaweb/aoconnect` installed and configured
- Randao CU/MU endpoints configured (`https://ur-cu.randao.net`, `https://ur-mu.randao.net`)
- `npm run dev` starts development server
- `npm run build` produces production bundle
- Hot module reloading functional

### Story 6.2: Core UI Components & AO Integration Layer

Implement the core UI components (SearchBar, SkillCard, CategoryBadge) and AO integration service using `@permaweb/aoconnect` dryrun queries for fetching real registry data.

**Acceptance Criteria:**

- AO client service using `aoconnect.dryrun()` with Randao endpoints
- SearchBar component with autocomplete
- SkillCard component displaying skill metadata
- Badge/Button components styled to match mockup
- Real data fetched from `RMIivqgsdvZobdv6ekkPIicDmX-925VcnivRzRFv_TQ` via dryrun
- Error handling for network failures and HTML error responses
- Loading states implemented
- Retry logic for gateway timeouts

### Story 6.3: Routing & Multi-Page Functionality

Implement React Router for multi-page navigation (homepage, search results, skill detail page) and complete all page layouts matching the mockup design.

**Acceptance Criteria:**

- React Router configured with proper routes
- Homepage with hero, featured skills, categories
- Search results page with filtering
- Skill detail page with full metadata display
- Navigation between pages functional
- Browser back/forward working correctly
- Responsive layout verified via Playwright at 375px/768px/1440px
- All pages load data from AO registry via aoconnect

### Story 6.4: Advanced UI Components & Page-Specific Features

Implement advanced shadcn-ui components (Tabs, Table, Input) and page-specific components (FilterSidebar, CopyButton, MarkdownRenderer) needed for Search Results and Skill Detail pages to complete the mockup implementation.

**Acceptance Criteria:**

- Tabs component family (Tabs, TabsList, TabsTrigger, TabsContent) with CLI theme variants
- Table component family (Table, TableHeader, TableBody, TableRow, TableHead, TableCell) with terminal styling
- Input component styled to match mockup (if not from Story 6.1)
- CopyButton component with clipboard → checkmark animation (2s timeout)
- FilterSidebar component (category checkboxes, author search, clear all)
- MarkdownRenderer component for basic markdown parsing
- GlobalNav component updated to match mockup (logo with $ cursor, mobile drawer)
- Breadcrumbs component with terminal styling
- Footer component updated to match mockup (Arweave badge, link groups)
- All components tested with Playwright at 375px/768px/1440px
- Components integrate correctly in Search Results and Skill Detail pages

### Story 6.5: Homepage Polish & Marketing Sections

Complete the homepage with marketing/educational sections and polish animations to achieve full mockup parity.

**Acceptance Criteria:**

- Hero section with animated gradient heading (blue → green gradient animation)
- "How It Works" section with 3 steps (numbered cards with icons and descriptions)
- Quick Start terminal block with installation command
- Copy button integration for Quick Start command
- Polish animations and transitions across homepage
- Smooth scroll behavior for section navigation
- Final responsive testing of complete homepage (375px/768px/1440px)
- Playwright verification of all homepage sections and interactions
- Performance optimization (lazy loading, code splitting if needed)

### Story 6.6: Tailwind v4 Theme Fix & Mockup Parity Polish

Complete migration to Tailwind CSS v4 with proper theme configuration and final polish to achieve 100% mockup parity.

**Acceptance Criteria:**

- Tailwind CSS v4 installed and configured correctly
- Theme colors match mockup exactly (terminal dark theme)
- Typography styles match mockup (JetBrains Mono, Inter fonts)
- All components styled with Tailwind v4 classes
- No styling regressions from v3 to v4 migration
- Final mockup comparison shows 100% parity
- All responsive breakpoints working correctly (375px/768px/1440px)
- Playwright verification of visual consistency across viewports

### Story 6.7: Fix AO Registry Response Format Mismatch

Fix critical integration bugs where search and skill detail pages fail due to response format mismatches between frontend expectations and AO registry process responses.

**Acceptance Criteria:**

- Search functionality returns results when searching for skills (e.g., "ao")
- Search results display correctly without showing "Search failed" error
- Skill detail page displays complete skill information when clicking on a skill card
- Skill detail page shows all tabs (Overview, Installation, Dependencies, Versions) with data
- All existing frontend functionality continues to work unchanged
- Integration with AO registry process follows existing aoconnect dryrun pattern
- No regression in existing search, list, or detail functionality verified

---

## Compatibility Requirements

- ✅ Existing APIs remain unchanged (AO process not modified)
- ✅ Database schema changes are backward compatible (N/A - no schema changes)
- ✅ UI changes follow existing patterns (uses mockup as design source)
- ✅ Performance impact is minimal (frontend runs independently)

---

## Risk Mitigation

**Primary Risk:**
Randao CU/MU gateway rate limiting, timeouts, or HTML error responses

**Mitigation:**
- Implement retry logic with exponential backoff
- Add fallback error states for network failures
- Cache frequently accessed data in React state/context
- Handle HTML error responses gracefully (common with CU issues)
- Document Randao endpoint usage patterns
- Implement timeout handling (30-45 second default)

**Rollback Plan:**
- Static mockup remains available for reference
- Frontend workspace can be removed without affecting CLI or AO process
- No database migrations or schema changes to revert

---

## Definition of Done

- ✅ All stories completed with acceptance criteria met
- ✅ Existing functionality verified through testing (CLI and AO process still functional)
- ✅ Integration points working correctly (aoconnect dryrun queries responding)
- ✅ Documentation updated appropriately (README for frontend workspace)
- ✅ No regression in existing features (CLI commands still work, AO process unchanged)

---

## Technical Context

**AO Process Details:**
- **Process ID:** `RMIivqgsdvZobdv6ekkPIicDmX-925VcnivRzRFv_TQ`
- **ADP Compliance:** v1.0
- **Message Handlers:**
  - `Info` - Process metadata and capabilities
  - `Search-Skills` - Query-based search (supports empty query for all skills)
  - `List-Skills` - Paginated listing with filters (Limit, Offset, Author, FilterTags, FilterName)
  - `Get-Skill` - Retrieve specific skill (Name, optional Version)
  - `Get-Skill-Versions` - Version history (Name)

**aoconnect Configuration:**

```typescript
import { connect } from '@permaweb/aoconnect';

const ao = connect({
  MU_URL: 'https://ur-mu.randao.net',
  CU_URL: 'https://ur-cu.randao.net',
});

const { dryrun } = ao;
```

**Example Dryrun Query:**

```typescript
// Search all skills
const result = await dryrun({
  process: 'RMIivqgsdvZobdv6ekkPIicDmX-925VcnivRzRFv_TQ',
  tags: [
    { name: 'Action', value: 'Search-Skills' },
    { name: 'Query', value: '' } // Empty for all skills
  ]
});

const skills = JSON.parse(result.Messages[0].Data);
```

**Design Reference:**
- Mockup Location: `mockups/developer-cli/`
- Color Scheme: Terminal dark theme
  - Background: `#10151B`
  - Surface: `#1a1f26`
  - Text: `#e2e8f0`
  - Syntax colors: blue (#61afef), green (#98c379), yellow (#e5c07b), purple (#c678dd), cyan (#56b6c2)
- Fonts: JetBrains Mono (monospace), Inter (sans-serif)

---

## Story Manager Handoff

**Context for Story Development:**

"Please develop detailed user stories for this brownfield epic. Key considerations:

- This is an enhancement to an existing system running **TypeScript monorepo with npm workspaces**
- Integration points:
  - **AO registry process** (`RMIivqgsdvZobdv6ekkPIicDmX-925VcnivRzRFv_TQ`)
  - **@permaweb/aoconnect** with `dryrun` for read-only queries
  - **Randao CU/MU endpoints** (`https://ur-cu.randao.net`, `https://ur-mu.randao.net`)
  - **Existing CLI workspace** (no modifications needed)
- Existing patterns to follow:
  - **Workspace structure** similar to `cli/` workspace
  - **TypeScript/Jest testing** like CLI
  - **shadcn-ui v4 components** for UI
  - **Playwright testing** for integration verification
  - **aoconnect skill patterns** from existing documentation
- Critical compatibility requirements:
  - **No AO process changes** - read-only data access via dryrun
  - **CLI tools unchanged** - frontend operates independently
  - **Responsive design** verified at 375px/768px/1440px viewports
  - **Handle gateway issues** - retry logic, HTML error responses, timeouts
- Each story must include:
  - **Playwright verification** of UI functionality
  - **Integration tests** for aoconnect dryrun queries
  - **Responsive design checks** across viewports
  - **Error handling tests** for gateway failures

The epic should maintain system integrity while delivering a **production-ready web interface for Claude Agent Skills registry browsing using aoconnect with Randao infrastructure**."

---

**Created:** 2025-10-24
**Author:** Product Owner (Sarah)
**Epic Number:** 6
