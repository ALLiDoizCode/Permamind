// Removed unused import

export interface PermawebDocsQuery {
  domains?: PermawebDomain[];
  maxResults?: number;
  query: string;
}

export interface PermawebDocsResponse {
  results: PermawebDocsResult[];
  sources: PermawebDomain[];
  totalResults: number;
}

export interface PermawebDocsResult {
  content: string;
  domain: PermawebDomain;
  isFullDocument: boolean;
  relevanceScore: number;
  url: string;
}

export type PermawebDomain =
  | "ao"
  | "ario"
  | "arweave"
  | "hyperbeam"
  | "permaweb-glossary";

interface CachedDoc {
  content: string;
  fetchedAt: Date;
}

interface DocSource {
  description: string;
  domain: PermawebDomain;
  keywords: {
    primary: string[];
    secondary: string[];
    technical: string[];
  };
  url: string;
}

const DOC_SOURCES: DocSource[] = [
  {
    description: "Arweave ecosystem development guides",
    domain: "arweave",
    keywords: {
      primary: [
        "arweave",
        "permaweb",
        "smartweave",
        "graphql",
        "transaction",
        "wallet",
        "bundling",
        "arfs",
        "arns",
      ],
      secondary: [
        "permanent",
        "storage",
        "blockchain",
        "decentralized",
        "ar",
        "winston",
        "pst",
        "profit sharing",
      ],
      technical: [
        "warp",
        "arweave-js",
        "ardrive",
        "arkb",
        "irys",
        "bundlr",
        "vouch",
        "smartweave contract",
      ],
    },
    url: "https://fuel_permawebllms.permagate.io/arweave-llms.txt",
  },
  {
    description: "AO computer system documentation",
    domain: "ao",
    keywords: {
      primary: [
        "ao",
        "process",
        "message",
        "lua",
        "aos",
        "spawn",
        "scheduler",
        "autonomous",
      ],
      secondary: [
        "actor",
        "hyper parallel",
        "computing",
        "decentralized",
        "holographic",
        "supercomputer",
      ],
      technical: [
        "aoconnect",
        "betteridea",
        "hyperbeam",
        "wasm",
        "module",
        "cron",
        "handler",
      ],
    },
    url: "https://fuel_permawebllms.permagate.io/ao-llms.txt",
  },
  {
    description: "AR.IO ecosystem infrastructure",
    domain: "ario",
    keywords: {
      primary: [
        "ar.io",
        "gateway",
        "arns",
        "wayfinder",
        "hosting",
        "deployment",
      ],
      secondary: [
        "permaweb",
        "decentralized",
        "web3",
        "infrastructure",
        "indexing",
        "resolver",
      ],
      technical: [
        "deploy",
        "archive",
        "content",
        "protocol",
        "node",
        "self-hosted",
        "configuration",
      ],
    },
    url: "https://fuel_permawebllms.permagate.io/ario-llms.txt",
  },
  {
    description: "HyperBEAM decentralized computing implementation",
    domain: "hyperbeam",
    keywords: {
      primary: [
        "hyperbeam",
        "device",
        "wasm",
        "erlang",
        "distributed",
        "computation",
      ],
      secondary: [
        "concurrent",
        "fault tolerant",
        "scalable",
        "trustless",
        "verifiable",
        "modular",
      ],
      technical: [
        "tee",
        "trusted execution",
        "pipeline",
        "http api",
        "composable",
        "performance",
      ],
    },
    url: "https://fuel_permawebllms.permagate.io/hyperbeam-llms.txt",
  },
  {
    description: "Comprehensive Permaweb glossary",
    domain: "permaweb-glossary",
    keywords: {
      primary: [
        "what is",
        "define",
        "definition",
        "explain",
        "glossary",
        "terminology",
        "meaning",
      ],
      secondary: [
        "concept",
        "understand",
        "basic",
        "introduction",
        "overview",
        "guide",
      ],
      technical: [
        "blockchain",
        "token",
        "economics",
        "cryptographic",
        "verification",
        "distributed",
      ],
    },
    url: "https://fuel_permawebllms.permagate.io/permaweb-glossary-llms.txt",
  },
];

export class PermawebDocs {
  private cache = new Map<PermawebDomain, CachedDoc>();
  private readonly cacheMaxAge = 24 * 60 * 60 * 1000; // 24 hours
  private readonly relevanceThreshold = 2;

  /**
   * Helper for tests: extract unique domains from results
   */
  static extractDomains(results: PermawebDocsResult[]): PermawebDomain[] {
    return Array.from(new Set(results.map((r) => r.domain)));
  }

  /**
   * Clear cached documentation
   */
  clearCache(domain?: PermawebDomain): void {
    if (domain) {
      this.cache.delete(domain);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get available documentation domains
   */
  getAvailableDomains(): PermawebDomain[] {
    return DOC_SOURCES.map((source) => source.domain);
  }

  /**
   * Get cache status for all domains
   */
  getCacheStatus(): Record<PermawebDomain, { age?: number; loaded: boolean }> {
    const status: Record<string, { age?: number; loaded: boolean }> = {};

    for (const domain of this.getAvailableDomains()) {
      const cached = this.cache.get(domain);
      if (cached) {
        const age = Date.now() - cached.fetchedAt.getTime();
        status[domain] = { age, loaded: true };
      } else {
        status[domain] = { loaded: false };
      }
    }

    return status as Record<PermawebDomain, { age?: number; loaded: boolean }>;
  }

  /**
   * Check if documentation is loaded and fresh
   */
  isDocLoaded(domain: PermawebDomain): boolean {
    const cached = this.cache.get(domain);
    if (!cached) return false;

    const age = Date.now() - cached.fetchedAt.getTime();
    return age < this.cacheMaxAge;
  }

  /**
   * Preload documentation for specific domains
   * Throws if any domain fails to load
   */
  async preload(
    domains: PermawebDomain[] = this.getAvailableDomains(),
  ): Promise<void> {
    // Use ensureDocsLoaded, but propagate errors if any fail
    await this.ensureDocsLoaded(domains);
  }

  /**
   * Query Permaweb documentation and return up to 20 most relevant chunks.
   * If requestedDomains is not provided, use domain detection to select relevant domains.
   * Throws if any domain fails to load.
   */
  async query(
    query: string,
    requestedDomains?: string[],
  ): Promise<PermawebDocsResult[]> {
    // Use domain detection if no domains specified
    let domains: PermawebDomain[];
    if (requestedDomains && requestedDomains.length > 0) {
      domains = requestedDomains.filter((d) =>
        this.getAvailableDomains().includes(d as PermawebDomain),
      ) as PermawebDomain[];
    } else {
      domains = this.detectRelevantDomains(query);
      // Always include glossary for definition/what is queries
      if (
        /\bwhat is\b|\bdefine\b|\bdefinition\b|\bglossary\b|\bmeaning\b|\bexplain\b/i.test(
          query,
        ) &&
        !domains.includes("permaweb-glossary")
      ) {
        domains.push("permaweb-glossary");
      }
      // Fallback: if no domains detected, search all
      if (domains.length === 0) {
        domains = this.getAvailableDomains();
      }
    }
    // Ensure docs are loaded (throws if any fail)
    await this.ensureDocsLoaded(domains);
    const results: PermawebDocsResult[] = [];
    for (const domain of domains) {
      const cached = this.cache.get(domain);
      if (!cached) continue;
      const url = DOC_SOURCES.find((s) => s.domain === domain)!.url;
      const chunks = this.chunkContent(domain, cached.content);
      for (const chunk of chunks) {
        const relevanceScore = this.calculateChunkRelevance(
          query,
          chunk,
          domain,
        );
        // Only include chunks that contain at least one query word and meet threshold
        const queryWords = query.toLowerCase().split(/\s+/);
        const containsQueryWord = queryWords.some((word) =>
          chunk.toLowerCase().includes(word),
        );
        if (relevanceScore >= this.relevanceThreshold && containsQueryWord) {
          results.push({
            content: chunk,
            domain,
            isFullDocument: false,
            relevanceScore,
            url,
          });
        }
      }
    }
    // Sort by relevance and return only the top 20
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 20);
  }

  /**
   * Calculate relevance of a chunk for a query and domain.
   */
  private calculateChunkRelevance(
    query: string,
    chunk: string,
    domain: PermawebDomain,
  ): number {
    const source = DOC_SOURCES.find((s) => s.domain === domain)!;
    const content = chunk.toLowerCase();
    const queryWords = query.toLowerCase().split(/\s+/);
    let score = 0;
    for (const word of queryWords) {
      if (content.includes(word)) score += 2;
    }
    const allKeywords = [
      ...source.keywords.primary,
      ...source.keywords.secondary,
      ...source.keywords.technical,
    ];
    for (const keyword of allKeywords) {
      if (content.includes(keyword)) score += 1;
    }
    return score;
  }

  private calculateDocumentRelevance(
    query: string,
    domain: PermawebDomain,
  ): number {
    const cached = this.cache.get(domain);
    if (!cached) return 0;
    const source = DOC_SOURCES.find((s) => s.domain === domain)!;
    const content = cached.content.toLowerCase();
    const queryWords = query.toLowerCase().split(/\s+/);
    let score = 0;
    for (const word of queryWords) {
      if (content.includes(word)) score += 2;
    }
    const allKeywords = [
      ...source.keywords.primary,
      ...source.keywords.secondary,
      ...source.keywords.technical,
    ];
    for (const keyword of allKeywords) {
      if (content.includes(keyword)) score += 1;
    }
    return score;
  }

  /**
   * Split documentation content into logical chunks by domain.
   * @param domain The documentation domain
   * @param content The full document content
   * @returns Array of chunked content strings
   */
  private chunkContent(domain: PermawebDomain, content: string): string[] {
    if (domain === "permaweb-glossary") {
      // Split by double newlines (glossary entries)
      return content
        .split(/\n{2,}/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    // Split by '---' delimiters (most llms.txt)
    return content
      .split(/^---+$/m)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  /**
   * Enhanced domain detection with better fallback scoring
   */
  private detectRelevantDomains(query: string): PermawebDomain[] {
    const domainScores = new Map<PermawebDomain, number>();
    const words = query.toLowerCase().split(/\s+/);

    for (const source of DOC_SOURCES) {
      let score = 0;
      const allKeywords = [
        ...source.keywords.primary.map((k) => ({ keyword: k, weight: 3 })),
        ...source.keywords.secondary.map((k) => ({ keyword: k, weight: 2 })),
        ...source.keywords.technical.map((k) => ({ keyword: k, weight: 2 })),
      ];

      for (const { keyword, weight } of allKeywords) {
        // Flexible: match if keyword is in query or any query word is in keyword
        if (
          query.toLowerCase().includes(keyword.toLowerCase()) ||
          words.some((word) => keyword.toLowerCase().includes(word))
        ) {
          score += weight;
        }
      }

      if (score > 0) {
        domainScores.set(source.domain, score);
      }
    }

    return Array.from(domainScores.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([domain]) => domain)
      .slice(0, 5);
  }

  /**
   * Enhanced document loading with retry logic
   * Throws if any domain fails to load
   */
  private async ensureDocsLoaded(domains: PermawebDomain[]): Promise<void> {
    const loadPromises = domains
      .filter((domain) => !this.isDocLoaded(domain))
      .map((domain) => this.loadDocumentationWithRetry(domain));
    // Wait for all, but throw if any fail
    const results = await Promise.allSettled(loadPromises);
    const rejected = results.find((r) => r.status === "rejected");
    if (rejected && rejected.status === "rejected") {
      throw rejected.reason;
    }
  }

  private async loadDocumentation(domain: PermawebDomain): Promise<void> {
    const source = DOC_SOURCES.find((s) => s.domain === domain);
    if (!source) {
      throw new Error(`Unknown domain: ${domain}`);
    }

    try {
      const response = await fetch(source.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const content = await response.text();
      if (!content || content.trim().length === 0) {
        throw new Error("Empty content received");
      }

      this.cache.set(domain, {
        content,
        fetchedAt: new Date(),
      });
    } catch (error) {
      throw new Error(
        `Failed to load ${domain} documentation: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Load documentation with retry logic for better reliability
   */
  private async loadDocumentationWithRetry(
    domain: PermawebDomain,
    maxRetries: number = 2,
  ): Promise<void> {
    let lastError: Error = new Error("Unknown error");

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.loadDocumentation(domain);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000),
          );
        }
      }
    }

    throw new Error(
      `Failed to load ${domain} after ${maxRetries + 1} attempts: ${lastError.message}`,
    );
  }
}

export const permawebDocs = new PermawebDocs();
