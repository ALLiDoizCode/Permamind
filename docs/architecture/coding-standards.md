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

- **Test Organization:**
  - Unit: `cli/tests/unit/**/*.test.ts`
  - Integration: `cli/tests/integration/**/*.test.ts`
  - Pattern: `*.test.ts`

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| TypeScript files | kebab-case | `manifest-parser.ts` |
| TypeScript classes | PascalCase | `ManifestParser` |
| TypeScript interfaces | PascalCase with 'I' prefix | `ISkillMetadata` |
| TypeScript functions/methods | camelCase | `parseManifest()` |
| TypeScript constants | SCREAMING_SNAKE_CASE | `MAX_BUNDLE_SIZE` |
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

**AO Process/Lua:**

1. **Monolithic code - no require() except json**
2. **Use msg.Timestamp, NEVER os.time()**
3. **All responses use ao.send(), never return values**
4. **All tag values must be strings**
5. **Validate msg fields before processing**

---
