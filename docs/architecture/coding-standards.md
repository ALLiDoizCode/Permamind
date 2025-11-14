# Coding Standards

## Core Standards

- **Languages & Runtimes:**
  - TypeScript 5.3.3 (strict mode) for CLI
  - Lua 5.3 for AO process
  - Node.js 20.11.0 LTS

- **Style & Linting:**
  - ESLint with TypeScript parser
  - Prettier (2-space indent, single quotes)
  - `.eslintrc.json` enforces strict rules

- **Test Organization (CLI):**
  - Unit: `cli/tests/unit/**/*.test.ts`
  - Integration: `cli/tests/integration/**/*.test.ts`
  - Pattern: `*.test.ts`
  - Framework: Jest

- **Test Organization (Frontend):**
  - Unit: `frontend/src/__tests__/**/*.test.tsx`
  - Component: `frontend/src/components/__tests__/**/*.test.tsx`
  - Integration: `frontend/src/__tests__/integration/**/*.test.tsx`
  - E2E: `frontend/e2e/**/*.spec.ts`
  - Pattern: `*.test.tsx` (Vitest), `*.spec.ts` (Playwright)
  - Frameworks: Vitest + React Testing Library (unit/integration), Playwright (E2E)

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| TypeScript files (CLI) | kebab-case | `manifest-parser.ts` |
| TypeScript classes | PascalCase | `ManifestParser` |
| TypeScript interfaces | PascalCase with 'I' prefix | `ISkillMetadata` |
| TypeScript functions/methods | camelCase | `parseManifest()` |
| TypeScript constants | SCREAMING_SNAKE_CASE | `MAX_BUNDLE_SIZE` |
| React components | PascalCase | `SkillCard.tsx` |
| React hooks | camelCase with 'use' prefix | `useSkillSearch.ts` |
| React props interfaces | PascalCase with 'Props' suffix | `SkillCardProps` |
| CSS classes (Tailwind) | Tailwind utility classes | `text-terminal-text bg-terminal-bg` |
| Test files | Match source file + `.test.tsx` or `.spec.ts` | `SkillCard.test.tsx`, `blog.spec.ts` |
| Lua files | kebab-case | `registry.lua` |
| Lua functions | camelCase | `registerSkill()` |
| Lua global tables | PascalCase | `Skills` |

## Critical Rules

**TypeScript/CLI:**

1. **Never use console.log in production - use logger**
2. **All API responses use typed interfaces**
3. **External SDK calls through client abstractions**
4. **All async operations have error handling**
5. **File paths use path.join() (cross-platform)**
6. **Secrets never in logs/errors/console**
7. **JSON parsing of external data uses try-catch**

**Frontend/React:**

1. **Never use inline styles - use Tailwind classes**
2. **All components must be typed (no implicit 'any')**
3. **Use shadcn-ui components over custom implementations**
4. **Sanitize all user-generated content with DOMPurify**
5. **Lazy load routes with React.lazy()**
6. **Add accessibility attributes (aria-label, role, tabIndex)**
7. **Test components with React Testing Library (not Enzyme)**
8. **Use Vitest for unit/integration, Playwright for E2E**

**AO Process/Lua:**

1. **Monolithic code - no require() except json**
2. **Use msg.Timestamp, NEVER os.time()**
3. **All responses use ao.send(), never return values**
4. **All tag values must be strings**
5. **Validate msg fields before processing**

---
