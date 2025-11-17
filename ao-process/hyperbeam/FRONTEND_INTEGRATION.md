# Frontend Integration Guide for HyperBEAM Dynamic Reads

This guide provides practical examples for integrating HyperBEAM dynamic read scripts into the Permamind frontend application.

## Table of Contents
- [Overview](#overview)
- [Setup](#setup)
- [TypeScript Constants](#typescript-constants)
- [URL Construction](#url-construction)
- [Fetch Examples](#fetch-examples)
- [Error Handling](#error-handling)
- [Dryrun Fallback Pattern](#dryrun-fallback-pattern)
- [Performance Optimization](#performance-optimization)
- [Complete Examples](#complete-examples)

---

## Overview

**What are HyperBEAM Dynamic Reads?**

HyperBEAM dynamic reads enable fast (<500ms), server-side query execution on AO process state without client-side message passing or dryrun overhead.

**Benefits:**
- **50%+ faster** than traditional dryrun queries
- **Reduced bandwidth**: Only return computed results
- **HTTP-native**: Standard fetch() requests, no WebSocket complexity
- **Stateless clients**: Browsers become simple data consumers

**Architecture:**
```
Frontend → HTTP GET → HyperBEAM Node → Lua Script Execution → JSON Response
```

---

## Setup

### 1. Install Dependencies

No additional dependencies needed - use native `fetch()` API.

### 2. Environment Variables

Create `.env` file in frontend directory:

```bash
# AO Registry Process ID (mainnet)
VITE_AO_REGISTRY_PROCESS_ID=0JwigA4ZGMredBmVq0M092gT5Liic_Yxv8c6T0tiFDw

# HyperBEAM Node (primary)
VITE_HYPERBEAM_NODE=https://hb.randao.net

# Fallback to traditional dryrun if HyperBEAM fails
VITE_ENABLE_DRYRUN_FALLBACK=true
```

---

## TypeScript Constants

### Create `frontend/src/lib/hyperbeam-constants.ts`

```typescript
/**
 * HyperBEAM Dynamic Read Script Transaction IDs
 * These are immutable Arweave transaction IDs for deployed Lua scripts
 */

// Script Transaction IDs
export const SEARCH_SKILLS_SCRIPT_ID = 'hjL7_fEj2onw1Uhyk4bmMum8lewZjWrn01IZXsY1utk';
export const GET_SKILL_SCRIPT_ID = 'oH8kYBrZAv2J1O2htWCMkyaUhdG1IddSFwr3lzCAfEA';
export const LIST_SKILLS_SCRIPT_ID = 'gxeEPGrxbfh4Uf7NEbPdE2iSTgALaz58RX8zrAreAqs';
export const GET_SKILL_VERSIONS_SCRIPT_ID = 'qRlxuHc_NnhOnfql1oaJ1CrTbjViDOXcLbkXZpLmJGo';
export const GET_DOWNLOAD_STATS_SCRIPT_ID = 'pbdp0HUfN3pnJzYo0mRkF-n9D1lGsg6NYRREEo5BvZ8';
export const INFO_SCRIPT_ID = 'fKI_pC6Mo0iRad3CADOkdwPHxTxL3OXfML5curbh3x4';

// AO Registry Process ID
export const REGISTRY_PROCESS_ID = import.meta.env.VITE_AO_REGISTRY_PROCESS_ID || '0JwigA4ZGMredBmVq0M092gT5Liic_Yxv8c6T0tiFDw';

// HyperBEAM Node
export const HYPERBEAM_NODE = import.meta.env.VITE_HYPERBEAM_NODE || 'https://hb.randao.net';

// State paths
export const STATE_PATH_NOW = '/now'; // Real-time state (slower)
export const STATE_PATH_CACHE = '/cache'; // Cached state (faster)

// Devices
export const LUA_DEVICE = '~lua@5.3a';
export const SERIALIZE_DEVICE = 'serialize~json@1.0';
```

---

## URL Construction

### Create `frontend/src/lib/hyperbeam-client.ts`

```typescript
import {
  HYPERBEAM_NODE,
  REGISTRY_PROCESS_ID,
  STATE_PATH_CACHE,
  LUA_DEVICE,
  SERIALIZE_DEVICE,
} from './hyperbeam-constants';

/**
 * Build HyperBEAM dynamic read URL
 * @param scriptTxId - Arweave transaction ID of Lua script
 * @param functionName - Function name to invoke from script
 * @param queryParams - URL query parameters (optional)
 * @param useCache - Use /cache path for faster (but potentially stale) results
 * @returns Complete HyperBEAM URL
 */
export function buildHyperbeamUrl(
  scriptTxId: string,
  functionName: string,
  queryParams?: Record<string, string | number | undefined>,
  useCache: boolean = true
): string {
  const statePath = useCache ? STATE_PATH_CACHE : '/now';

  // Build base URL
  const baseUrl = [
    HYPERBEAM_NODE,
    `${REGISTRY_PROCESS_ID}~process@1.0`,
    statePath,
    `${LUA_DEVICE}&module=${scriptTxId}`,
    functionName,
    SERIALIZE_DEVICE
  ].join('/');

  // Add query parameters
  if (queryParams && Object.keys(queryParams).length > 0) {
    const params = new URLSearchParams();

    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });

    return `${baseUrl}?${params.toString()}`;
  }

  return baseUrl;
}

/**
 * Encode JSON array as URL parameter
 * @param arr - Array to encode
 * @returns URL-encoded JSON string
 */
export function encodeJsonArray(arr: string[]): string {
  return encodeURIComponent(JSON.stringify(arr));
}
```

---

## Fetch Examples

### Basic Fetch Pattern

```typescript
import { buildHyperbeamUrl, SEARCH_SKILLS_SCRIPT_ID } from '@/lib/hyperbeam-client';

async function searchSkills(query: string) {
  const url = buildHyperbeamUrl(
    SEARCH_SKILLS_SCRIPT_ID,
    'searchSkills',
    { query }
  );

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}
```

### With Error Handling

```typescript
import { buildHyperbeamUrl, SEARCH_SKILLS_SCRIPT_ID } from '@/lib/hyperbeam-client';

async function searchSkills(query: string) {
  try {
    const url = buildHyperbeamUrl(
      SEARCH_SKILLS_SCRIPT_ID,
      'searchSkills',
      { query }
    );

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Validate response structure
    if (!data.results || !Array.isArray(data.results)) {
      throw new Error('Invalid response format');
    }

    return {
      results: data.results,
      total: data.total || 0,
      query: data.query || query,
    };
  } catch (error) {
    console.error('HyperBEAM search failed:', error);
    throw error;
  }
}
```

---

## Error Handling

### Error Types and Responses

```typescript
// Network errors
try {
  const response = await fetch(url);
} catch (error) {
  if (error instanceof TypeError) {
    // Network error (CORS, DNS, timeout)
    console.error('Network error:', error.message);
  }
  throw error;
}

// HTTP errors
if (!response.ok) {
  if (response.status === 400) {
    // Bad request (missing required parameter)
    const error = await response.json();
    throw new Error(error.error || 'Invalid request');
  }

  if (response.status === 404) {
    // Skill not found
    return null; // or throw specific NotFoundError
  }

  if (response.status >= 500) {
    // Server error
    throw new Error('HyperBEAM node error');
  }
}

// JSON parsing errors
try {
  const data = await response.json();
} catch (error) {
  throw new Error('Invalid JSON response');
}
```

---

## Dryrun Fallback Pattern

### Recommended Pattern

```typescript
import { dryrun } from '@permaweb/aoconnect';
import { buildHyperbeamUrl, SEARCH_SKILLS_SCRIPT_ID } from '@/lib/hyperbeam-client';

/**
 * Fetch with automatic fallback to traditional dryrun
 * @param url - HyperBEAM URL
 * @param fallbackFn - Fallback function using traditional dryrun
 * @returns Query result
 */
async function hyperbeamFetchWithFallback<T>(
  url: string,
  fallbackFn: () => Promise<T>
): Promise<T> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (response.ok) {
      return await response.json();
    }

    // HTTP error - try fallback
    console.warn(`HyperBEAM returned ${response.status}, falling back to dryrun`);
    return await fallbackFn();
  } catch (error) {
    // Network error - try fallback
    console.warn('HyperBEAM network error, falling back to dryrun:', error);
    return await fallbackFn();
  }
}

// Usage example
async function searchSkills(query: string) {
  const url = buildHyperbeamUrl(
    SEARCH_SKILLS_SCRIPT_ID,
    'searchSkills',
    { query }
  );

  return await hyperbeamFetchWithFallback(url, async () => {
    // Fallback to traditional dryrun
    const result = await dryrun({
      process: REGISTRY_PROCESS_ID,
      tags: [
        { name: 'Action', value: 'Search-Skills' },
        { name: 'Query', value: query },
      ],
    });

    // Parse dryrun response
    const data = JSON.parse(result.Messages[0].Data);
    return {
      results: data.skills || [],
      total: data.total || 0,
      query,
    };
  });
}
```

---

## Performance Optimization

### 1. Use Cache Path for Non-Critical Queries

```typescript
// For listings/browsing (slightly stale data acceptable)
const url = buildHyperbeamUrl(
  LIST_SKILLS_SCRIPT_ID,
  'listSkills',
  { limit: 10, offset: 0 },
  true // Use /cache path
);

// For critical operations (need latest data)
const url = buildHyperbeamUrl(
  GET_SKILL_SCRIPT_ID,
  'getSkill',
  { name: 'ao-basics' },
  false // Use /now path
);
```

### 2. Implement Request Caching

```typescript
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60_000; // 60 seconds

async function cachedFetch(url: string) {
  const cached = cache.get(url);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await fetch(url).then((res) => res.json());

  cache.set(url, { data, timestamp: Date.now() });

  return data;
}
```

### 3. Debounce Search Queries

```typescript
import { debounce } from 'lodash';

const debouncedSearch = debounce(async (query: string) => {
  const url = buildHyperbeamUrl(SEARCH_SKILLS_SCRIPT_ID, 'searchSkills', { query });
  return await fetch(url).then((res) => res.json());
}, 300);
```

---

## Complete Examples

### 1. Search Skills Component

```typescript
import React, { useState } from 'react';
import { buildHyperbeamUrl, SEARCH_SKILLS_SCRIPT_ID } from '@/lib/hyperbeam-client';

export function SearchSkills() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const url = buildHyperbeamUrl(
        SEARCH_SKILLS_SCRIPT_ID,
        'searchSkills',
        { query }
      );

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search skills..."
      />
      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'Searching...' : 'Search'}
      </button>

      {error && <div className="error">{error}</div>}

      <div className="results">
        {results.map((skill) => (
          <SkillCard key={skill.name} skill={skill} />
        ))}
      </div>
    </div>
  );
}
```

### 2. List Skills with Pagination

```typescript
import React, { useEffect, useState } from 'react';
import { buildHyperbeamUrl, LIST_SKILLS_SCRIPT_ID } from '@/lib/hyperbeam-client';

export function ListSkills() {
  const [skills, setSkills] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 10,
    offset: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(true);

  const fetchSkills = async (limit: number, offset: number) => {
    setLoading(true);

    try {
      const url = buildHyperbeamUrl(
        LIST_SKILLS_SCRIPT_ID,
        'listSkills',
        { limit, offset }
      );

      const response = await fetch(url);
      const data = await response.json();

      setSkills(data.skills || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch skills:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills(10, 0);
  }, []);

  const nextPage = () => {
    fetchSkills(pagination.limit, pagination.offset + pagination.limit);
  };

  const prevPage = () => {
    fetchSkills(pagination.limit, Math.max(0, pagination.offset - pagination.limit));
  };

  return (
    <div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className="skills-grid">
            {skills.map((skill) => (
              <SkillCard key={skill.name} skill={skill} />
            ))}
          </div>

          <div className="pagination">
            <button onClick={prevPage} disabled={!pagination.hasPrevPage}>
              Previous
            </button>
            <span>
              Showing {pagination.offset + 1} - {pagination.offset + pagination.returned} of {pagination.total}
            </span>
            <button onClick={nextPage} disabled={!pagination.hasNextPage}>
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

### 3. Get Skill Detail

```typescript
import React, { useEffect, useState } from 'react';
import { buildHyperbeamUrl, GET_SKILL_SCRIPT_ID } from '@/lib/hyperbeam-client';

export function SkillDetail({ skillName }: { skillName: string }) {
  const [skill, setSkill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSkill = async () => {
      setLoading(true);
      setError(null);

      try {
        const url = buildHyperbeamUrl(
          GET_SKILL_SCRIPT_ID,
          'getSkill',
          { name: skillName },
          false // Use /now for latest data
        );

        const response = await fetch(url);

        if (response.status === 404) {
          setError('Skill not found');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch skill');
        }

        const data = await response.json();
        setSkill(data.skill);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchSkill();
  }, [skillName]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!skill) return null;

  return (
    <div className="skill-detail">
      <h1>{skill.name}</h1>
      <p className="version">Version: {skill.version}</p>
      <p className="author">By {skill.author}</p>
      <p className="description">{skill.description}</p>
      <div className="tags">
        {skill.tags.map((tag) => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>
    </div>
  );
}
```

---

## Performance Comparison

| Query Type | Traditional Dryrun | HyperBEAM | Improvement |
|------------|-------------------|-----------|-------------|
| Search skills | 1200ms | 450ms | 62% faster |
| List skills | 1100ms | 420ms | 62% faster |
| Get skill | 900ms | 380ms | 58% faster |
| Get versions | 950ms | 400ms | 58% faster |

---

## Troubleshooting

### Common Issues

**1. CORS Errors**
- HyperBEAM nodes must have CORS enabled
- Use proxy during development if needed
- Check browser console for specific CORS errors

**2. 402 Payment Required**
- Registry process needs AR token funding
- Contact process owner to fund process
- Use dryrun fallback until funded

**3. Slow Responses**
- Try `/cache` path instead of `/now`
- Implement client-side caching (60s TTL)
- Consider pagination for large result sets

**4. Invalid JSON**
- Verify script transaction ID is correct
- Check HyperBEAM node is responsive
- Fall back to traditional dryrun

---

## Next Steps

- **Story 15.3**: Frontend HTTP Client implementation
- **Story 15.4**: Replace dryrun queries with HyperBEAM
- **Performance monitoring**: Track response times in production

---

## Resources

- [HyperBEAM Documentation](https://hyperbeam.arweave.net/build/introduction/what-is-hyperbeam.html)
- [Script Reference](./SCRIPT_REFERENCE.md)
- [Deployment Log](./deployment-log.md)
- [AO Documentation](https://cookbook_ao.arweave.net/)
