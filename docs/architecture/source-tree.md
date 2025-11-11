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
