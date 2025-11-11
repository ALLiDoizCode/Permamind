# Agent Skills Registry - Developer CLI Mockup

A complete multi-page UI mockup for the Agent Skills Registry with a developer-focused CLI aesthetic.

## 🎨 Design Direction

**Developer CLI Tool** - Terminal-inspired dark theme with syntax highlighting colors, monospace fonts, and command-line aesthetic. Features terminal window decorations, `$` prompts, and code-like interactions throughout the interface.

### Color Palette

- **Background**: `#10151B` (Terminal BG)
- **Surface**: `#1a1f26` (Terminal Surface)
- **Border**: `#2d3748` (Terminal Border)
- **Text**: `#e2e8f0` (Terminal Text)
- **Muted**: `#94a3b8` (Terminal Muted)

**Syntax Highlighting Colors**:
- **Blue**: `#61afef` (Primary accent, links, actions)
- **Green**: `#98c379` (Success, prompts, installation)
- **Yellow**: `#e5c07b` (Warnings, highlights)
- **Red**: `#e06c75` (Errors, destructive actions)
- **Purple**: `#c678dd` (Comments, secondary elements)
- **Cyan**: `#56b6c2` (Categories, tags)

### Typography

- **Primary Font**: JetBrains Mono (monospace) - For headers, labels, code
- **Secondary Font**: Inter (sans-serif) - For body text, descriptions

## 📁 Project Structure

```
mockups/developer-cli/
├── index.html              # Homepage (Landing Page) - ORIGINAL, DO NOT MODIFY
├── search-results.html     # Search Results Page - NEW
├── skill-detail.html       # Skill Detail Page - NEW
├── components.js           # Shared UI Components - NEW
├── navigation.js           # Navigation Components - NEW
└── README.md              # This file - NEW
```

## 📄 Pages

### 1. Homepage (`index.html`)

**Status**: ✅ Original page (DO NOT MODIFY)

**Features**:
- Hero section with animated gradient heading
- Search bar with `$` prompt and keyboard shortcut indicator
- Featured skills grid (6 skills, 3 columns)
- Category badges section
- "How It Works" section with 3 steps
- Terminal-style quick start command block
- Footer with Arweave/AO badge

**Key Interactions**:
- Search bar has focus indicator and keyboard shortcut display
- Skill cards have hover effects with gradient borders
- Category badges are clickable
- Terminal window shows macOS-style traffic lights

---

### 2. Search Results (`search-results.html`)

**Status**: ✅ Complete

**Features**:
- Global navigation with breadcrumbs
- Search bar (same as homepage)
- Results count with active filter badges
- Desktop: Left sidebar with filters (Category checkboxes, Author search)
- Mobile: Bottom sheet filter drawer
- Sort dropdown (Relevance, Popular, Recent, A-Z)
- View toggle (Grid/List) - Desktop only
- 2-column skill card grid (desktop with sidebar)
- Pagination controls
- Empty state with "Clear Filters" button

**Key Interactions**:
- Filters update results instantly (no Apply button)
- Active filters show as dismissible badges
- Mobile filter button shows count badge
- Skill cards navigate to skill-detail.html on click
- Sort dropdown updates results immediately

**Responsive Breakpoints**:
- **Mobile** (< 640px): Single column, bottom sheet filters
- **Tablet** (640-1023px): 2 columns, bottom sheet filters
- **Desktop** (1024px+): 2 columns + left sidebar (280px)

---

### 3. Skill Detail (`skill-detail.html`)

**Status**: ✅ Complete

**Features**:
- Global navigation with breadcrumbs (Home / Category / Skill Name)
- Skill header section:
  - Skill name with gradient styling
  - Description, badges (version, license, category)
  - Published date
  - "Install via CLI" button (copies command)
  - "View on Arweave" button (opens in new tab)
- Tab navigation: Overview | Dependencies | Versions
- **Overview Tab**:
  - Quick start code block with copy button
  - Full description with markdown-style formatting
  - Features list
  - Example code snippets with syntax highlighting
- **Dependencies Tab**:
  - List of dependencies with versions
  - Each dependency is clickable (navigates to its detail page)
  - Empty state: "No dependencies"
- **Versions Tab**:
  - Table with version history
  - Columns: Version, Published Date, Arweave TXID
  - "Latest" badge on current version
- Right sidebar:
  - Statistics card (Downloads, Dependencies count)
  - Author card (Name, Address, "View all by author" link)
  - Tags card (All tags as clickable badges)

**Key Interactions**:
- Copy buttons show checkmark on success (2s timeout)
- Tab navigation with keyboard support
- Dependency links navigate to other skill pages
- Tag badges navigate to filtered search results
- Mobile: Sidebar content appears inline below tabs

**Responsive Breakpoints**:
- **Mobile** (< 640px): Single column, sidebar inline
- **Tablet** (640-1023px): Single column, sidebar inline
- **Desktop** (1024px+): Two columns (70% content + 30% sidebar)

---

## 🧩 Components

### Shared Components (`components.js`)

All components are exported via `window.Components` for use across pages.

#### 1. **Button**
- **Variants**: `default`, `outline`, `ghost`, `command`
- **Sizes**: `sm`, `default`, `lg`
- **Usage**: Primary actions, navigation, CLI commands

#### 2. **Card** + Card Sub-components
- **Components**: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- **Props**: `hover` (adds gradient border effect)
- **Usage**: Skill cards, sidebar widgets, content containers

#### 3. **Badge**
- **Variants**: `default`, `blue`, `green`, `yellow`, `purple`, `cyan`, `red`
- **Usage**: Version tags, categories, status indicators

#### 4. **Input**
- **Styling**: Terminal-themed with syntax-blue focus ring
- **Usage**: Filter inputs, form fields

#### 5. **SearchBar**
- **Features**: `$` prompt, keyboard shortcut display (⌘K), focus indicator
- **Props**: `placeholder`, `onSearch`, `className`
- **Usage**: Homepage and search results page

#### 6. **SkillCard**
- **Features**: Gradient title, version/category badges, download count, author info
- **Props**: `name`, `description`, `author`, `version`, `category`, `downloads`, `onClick`
- **Usage**: Homepage featured section, search results

#### 7. **Tabs** + Tab Sub-components
- **Components**: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- **Features**: CLI-styled with terminal colors, keyboard navigation
- **Usage**: Skill detail page (Overview/Dependencies/Versions)

#### 8. **Table** + Table Sub-components
- **Components**: `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`
- **Features**: Monospace font, hover effects, terminal styling
- **Usage**: Version history table

#### 9. **CopyButton**
- **Features**: Clipboard icon → Checkmark on success, 2s timeout
- **Props**: `text`, `className`
- **Usage**: Code blocks, install commands

#### 10. **MarkdownRenderer**
- **Features**: Basic markdown parsing (headers, bold, inline code, paragraphs)
- **Props**: `content`, `className`
- **Usage**: Skill descriptions, documentation (basic demo version)

#### 11. **FilterSidebar**
- **Features**: Category checkboxes, author search input, "Clear All" button
- **Props**: `categories`, `onFilterChange`, `className`
- **Usage**: Search results page filters

---

### Navigation Components (`navigation.js`)

All components are exported via `window.Navigation` for use across pages.

#### 1. **GlobalNav**
- **Features**:
  - Logo with `$` prompt and cursor animation
  - Desktop: Horizontal navigation (browse, docs, github, install CLI button)
  - Mobile: Hamburger menu with drawer
  - Sticky positioning with backdrop blur
- **Props**: `currentPage` (for active state highlighting)

#### 2. **Breadcrumbs**
- **Features**: Home link + path array with `/` separators
- **Props**: `path` (array of strings or objects with `label` and `href`)
- **Styling**: Monospace font, terminal colors, hover effects

#### 3. **Footer**
- **Features**: Arweave/AO badge, link groups, community message
- **Links**: documentation, github, cli-guide, publish-skill
- **Styling**: Terminal border top, centered layout

---

## 🌐 How to View the Mockups

These pages use external JavaScript files (`components.js`, `navigation.js`), so you **must** run a local HTTP server to view them correctly. Simply opening the HTML files in a browser will not work due to CORS restrictions.

### Option 1: Python HTTP Server (Recommended)

```bash
# Navigate to the mockup directory
cd mockups/developer-cli

# Start the server (Python 3)
python3 -m http.server 8000

# View in browser:
# Homepage:        http://localhost:8000/index.html
# Search Results:  http://localhost:8000/search-results.html
# Skill Detail:    http://localhost:8000/skill-detail.html
```

### Option 2: Node.js HTTP Server

```bash
# Install http-server globally (once)
npm install -g http-server

# Navigate to the mockup directory
cd mockups/developer-cli

# Start the server
http-server -p 8000

# View in browser (same URLs as above)
```

### Option 3: VS Code Live Server Extension

1. Install the "Live Server" extension in VS Code
2. Right-click on any HTML file
3. Select "Open with Live Server"
4. Navigate between pages using the links

---

## 🎯 Key Features

### Design Consistency

- **Terminal Aesthetic**: All pages use dark terminal colors with syntax highlighting
- **Monospace Typography**: JetBrains Mono for technical elements, Inter for readability
- **Component Reusability**: Shared components ensure visual consistency
- **Gradient Accents**: Blue-to-green gradients on headings and hover states

### Accessibility (WCAG 2.1 AA Compliant)

- ✅ Skip-to-content link for keyboard navigation
- ✅ Semantic HTML (`nav`, `main`, `article`, `aside`, `footer`)
- ✅ ARIA labels for icon-only buttons
- ✅ Focus indicators (2px solid syntax-blue ring)
- ✅ Color contrast ratios meet 4.5:1 minimum
- ✅ Keyboard navigation support (Tab, Enter, Escape)
- ✅ `aria-current="page"` for active navigation
- ✅ Screen reader friendly (alt text, aria-labels)

### Responsive Design

- **Mobile-First**: Single column layouts, touch-optimized targets (44x44px)
- **Tablet**: 2-column grids, hybrid navigation (drawer + header)
- **Desktop**: 3-column grids, left/right sidebars, full navigation
- **Wide**: Max content width 1280px, generous spacing

### Interactive States

- **Hover**: Gradient borders, color transitions, elevation
- **Focus**: Visible focus rings, keyboard accessibility
- **Active**: Highlighted navigation, selected filters, active tabs
- **Loading**: Skeleton placeholders (not implemented in static mockup)
- **Success**: Checkmarks, color changes (copy buttons)

---

## 🔗 Navigation Flow

```
Homepage (index.html)
├── Search → Search Results (search-results.html)
│   └── Skill Card → Skill Detail (skill-detail.html)
├── Category Badge → Search Results (filtered)
└── Featured Skill → Skill Detail

Search Results (search-results.html)
├── Breadcrumb: Home → Homepage
├── Skill Card → Skill Detail
└── Filter Tags → Search Results (filtered)

Skill Detail (skill-detail.html)
├── Breadcrumb: Home → Homepage
├── Breadcrumb: Category → Search Results (filtered)
├── Dependency Link → Skill Detail (other skill)
└── Tag Badge → Search Results (filtered by tag)
```

---

## 📝 Sample Data

### Featured Skills (Homepage)

1. `@arweave/storage` - Permanent storage utilities (arweave)
2. `@ao/process-dev` - AO process development toolkit (ao-protocol)
3. `@docs/markdown-render` - Markdown rendering (documentation)
4. `@blockchain/web3-bridge` - Multi-chain bridge (blockchain)
5. `@cli/deploy-tools` - CLI deployment utilities (cli-tools)
6. `@ai/workflow-optimizer` - AI workflow optimization (ai-workflows)

### Categories

- **blockchain** (42 skills)
- **documentation** (38 skills)
- **arweave** (56 skills)
- **ao-protocol** (31 skills)
- **cli-tools** (27 skills)
- **ai-workflows** (19 skills)

---

## 🚀 Next Steps

### Frontend Development

1. **Set up React/Next.js project** with TypeScript
2. **Install shadcn/ui v4** with Tailwind CSS configuration
3. **Copy Tailwind theme** from mockup (colors, fonts, spacing)
4. **Convert HTML pages** to React components
5. **Implement routing** (Next.js App Router or React Router)
6. **Add state management** (React Query for API calls, Zustand for client state)
7. **Integrate AO Registry API** (search, fetch skill metadata)

### Backend Integration

1. **Connect to AO Registry process** (search skills, fetch metadata)
2. **Implement caching** (React Query with 5-minute stale time)
3. **Add error handling** (fallback UI, retry logic)
4. **Implement pagination** (server-side or client-side)
5. **Add search suggestions** (debounced autocomplete)

### Enhancements

1. **Dark/Light Mode Toggle** (optional, dark mode is primary)
2. **Keyboard Shortcuts** (⌘K for search, arrow keys for navigation)
3. **Loading States** (skeleton screens, spinners)
4. **Toast Notifications** (copy success, errors)
5. **Analytics** (track search queries, popular skills)

---

## 📦 Dependencies

### CDN Resources (Mockup Only)

- **Tailwind CSS**: `https://cdn.tailwindcss.com`
- **React 18**: `https://unpkg.com/react@18/umd/react.production.min.js`
- **ReactDOM 18**: `https://unpkg.com/react-dom@18/umd/react-dom.production.min.js`
- **Babel Standalone**: `https://unpkg.com/@babel/standalone/babel.min.js`
- **Google Fonts**: JetBrains Mono + Inter

### Production Dependencies (Recommended)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.0",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "lucide-react": "^0.294.0",
    "tailwindcss": "^3.4.0",
    "@tanstack/react-query": "^5.0.0"
  }
}
```

---

## ⚠️ Important Notes

1. **DO NOT MODIFY** `index.html` - It's the original landing page
2. **External JS files** require HTTP server to load (CORS restrictions)
3. **Sample data** is hardcoded - replace with API calls in production
4. **Accessibility** features are built-in, ensure they're preserved during development
5. **Responsive design** uses Tailwind breakpoints (sm: 640px, md: 768px, lg: 1024px)

---

## 🎨 Design Credits

- **Design Direction**: Developer CLI Tool aesthetic
- **Color Palette**: One Dark Pro (VS Code theme) inspired
- **Typography**: JetBrains Mono (monospace), Inter (sans-serif)
- **Component Library**: shadcn/ui v4 (adapted for terminal theme)
- **Icons**: Heroicons (inline SVG)

---

## 📞 Support

For questions or issues with the mockup:
1. Review this README carefully
2. Check the front-end specification (`docs/front-end-spec.md`)
3. Inspect the existing `index.html` for design patterns
4. Test with a local HTTP server (not file:// protocol)

---

**Last Updated**: 2025-10-22
**Status**: ✅ Complete - All pages and components implemented
**Version**: 1.0.0
