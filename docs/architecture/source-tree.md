# Source Tree

```
agent-skills-registry/
├── .github/
│   └── workflows/
│       ├── deploy-ao-process.yml
│       ├── publish-cli.yml
│       └── test.yml
│
├── cli/
│   ├── src/
│   │   ├── index.ts
│   │   ├── commands/
│   │   │   ├── base.ts
│   │   │   ├── publish.ts
│   │   │   ├── search.ts
│   │   │   └── install.ts
│   │   ├── clients/
│   │   │   ├── arweave-client.ts
│   │   │   └── ao-registry-client.ts
│   │   ├── lib/
│   │   │   ├── bundler.ts
│   │   │   ├── dependency-resolver.ts
│   │   │   ├── circular-detector.ts
│   │   │   ├── topological-sorter.ts
│   │   │   ├── lock-file-manager.ts
│   │   │   ├── wallet-manager.ts
│   │   │   ├── config-loader.ts
│   │   │   ├── logger.ts
│   │   │   └── retry.ts
│   │   ├── parsers/
│   │   │   └── manifest-parser.ts
│   │   ├── formatters/
│   │   │   └── search-results.ts
│   │   ├── schemas/
│   │   │   ├── skill-manifest.schema.json
│   │   │   └── skills-lock.schema.json
│   │   ├── types/
│   │   │   ├── skill.ts
│   │   │   ├── lock-file.ts
│   │   │   ├── commands.ts
│   │   │   └── errors.ts
│   │   ├── ui/
│   │   │   ├── wallet-connect.html
│   │   │   ├── wallet-connect.css
│   │   │   ├── wallet-connect.js
│   │   │   └── README.md
│   │   └── utils/
│   │       ├── version-compare.ts
│   │       └── retry.ts
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   ├── fixtures/
│   │   └── helpers/
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── ao-process/
│   ├── registry.lua
│   ├── tests/
│   ├── deploy.md
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   └── Footer.tsx
│   │   │   ├── sections/
│   │   │   │   ├── HeroSection.tsx
│   │   │   │   ├── FeaturedSkillsSection.tsx
│   │   │   │   └── HowItWorksSection.tsx
│   │   │   ├── ui/
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   └── tabs.tsx
│   │   │   ├── __tests__/
│   │   │   │   └── MarkdownRenderer.*.test.tsx
│   │   │   ├── MarkdownRenderer.tsx
│   │   │   ├── SkillCard.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── LoadingSkeleton.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── Breadcrumbs.tsx
│   │   │   ├── CopyButton.tsx
│   │   │   └── ScrollToTop.tsx
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── SearchResults.tsx
│   │   │   ├── SkillDetail.tsx
│   │   │   ├── Documentation.tsx
│   │   │   ├── CliGuide.tsx
│   │   │   ├── McpGuide.tsx
│   │   │   ├── PublishSkill.tsx
│   │   │   └── NotFound.tsx
│   │   ├── routes/
│   │   │   └── index.tsx
│   │   ├── hooks/
│   │   │   ├── useSkillSearch.ts
│   │   │   └── useArnsName.ts
│   │   ├── services/
│   │   │   └── ao-registry.ts
│   │   ├── lib/
│   │   │   ├── utils.ts
│   │   │   └── ao-client.ts
│   │   ├── types/
│   │   │   └── ao.ts
│   │   ├── __tests__/
│   │   │   ├── components/
│   │   │   │   ├── layout/
│   │   │   │   ├── sections/
│   │   │   │   └── ui/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── lib/
│   │   │   └── integration/
│   │   ├── index.css
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── e2e/
│   │   └── *.spec.ts
│   ├── public/
│   │   ├── blog/
│   │   └── assets/
│   ├── package.json
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── README.md
│
├── skills/
│   ├── ao-basics/
│   ├── arweave-fundamentals/
│   ├── permamind-integration/
│   ├── agent-skills-best-practices/
│   └── cli-development/
│
├── docs/
│   ├── prd.md
│   ├── architecture.md
│   ├── api-reference.md
│   └── troubleshooting.md
│
├── scripts/
│   ├── bootstrap-publish.ts
│   ├── deploy-ao-process.ts
│   ├── deploy-registry-process.md
│   ├── validate-skills.ts
│   └── generate-schemas.ts
│
├── .env.example
├── .skillsrc.example
├── .gitignore
├── .prettierrc
├── .eslintrc.json
├── package.json
├── tsconfig.json
├── jest.config.js
├── LICENSE
└── README.md
```

---
