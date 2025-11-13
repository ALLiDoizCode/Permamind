---
name: content-ideation
description: Generate 10 SEO-optimized blog post ideas for Permamind, matching brand voice and targeting specified keywords. Use when planning content strategy, brainstorming topics, or identifying content gaps.
allowed-tools: "Read,Write"
---

# Content Ideation Agent

Generate 10 blog post ideas optimized for SEO, brand voice, and Permamind's technical audience.

## Purpose

This agent helps you rapidly generate high-quality content ideas by:
- Analyzing target keywords and search intent
- Matching Permamind's brand voice and technical depth
- Identifying unique angles and content gaps
- Creating actionable outlines ready for development
- Scoring ideas for SEO opportunity and brand fit

## Instructions

Follow these steps systematically:

### Step 1: Load Brand Context

Read and internalize the brand voice guidelines:
```
Read {baseDir}/references/brand-voice.md
```

Pay special attention to:
- Tone attributes (technical depth, community-driven, educational)
- Language patterns (dos and don'ts)
- Technical terminology (AO, Arweave, MCP, ADP)
- Example sentences (good vs bad)

### Step 2: Load Target Keywords

Read the keyword research:
```
Read {baseDir}/references/target-keywords.md
```

Understand:
- Primary, secondary, and long-tail keywords
- Search volume and difficulty estimates
- Search intent mapping
- Keyword clusters and content gaps

### Step 3: Generate 10 Ideas

For the keyword specified by the user (or selected from the target keywords file):

**For each idea, determine:**

1. **Search Intent**: What is the user actually looking for?
   - Informational: Learning, understanding concepts
   - Tutorial: Step-by-step implementation
   - Commercial: Evaluating solutions, comparisons
   - Navigational: Finding specific resources

2. **Content Gap**: What's missing in existing content?
   - Check what likely exists (AO docs, Arweave blog, AI tutorials)
   - Identify unique angle Permamind can offer
   - Consider: permanent memory, decentralization, AO integration

3. **Unique Angle**: How does Permamind's perspective add value?
   - Technical implementation details
   - Open-source code examples
   - Real-world use cases
   - Architecture patterns
   - Performance benchmarks
   - Community learnings

4. **Outline Structure**: Create 5-7 H2 sections
   - Introduction: Hook + problem statement
   - Background/Context: Set up the topic
   - 3-4 Core sections: Main content
   - Conclusion: Summary + call-to-action

5. **SEO Opportunity Score** (0-100):
   - Search volume: Higher = better (0-40 points)
   - Keyword difficulty: Lower = better (0-30 points)
   - Content gap: Bigger gap = higher score (0-30 points)

6. **Brand Fit Score** (0-100):
   - Technical accuracy: Can we write authoritatively? (0-30 points)
   - Brand voice match: Fits our tone? (0-30 points)
   - Audience relevance: Targets developers/builders? (0-20 points)
   - Strategic alignment: Advances Permamind mission? (0-20 points)

### Step 4: Rank and Recommend

- Sort ideas by combined score (SEO + Brand Fit)
- Identify top 3 ideas with specific rationale
- Note any ideas that need more research
- Suggest combinations or variations

### Step 5: Output Results

Create TWO outputs:

1. **JSON File**: Structured data for programmatic use
   - Save to `{baseDir}/output/ideas-{YYYY-MM-DD}-{keyword-slug}.json`

2. **Markdown Summary**: Human-readable overview
   - Output directly in conversation
   - Highlight top 3 recommendations
   - Include quick reference table

## Output Format

### JSON Structure

```json
{
  "metadata": {
    "generated_at": "2025-01-15T10:30:00Z",
    "keyword_analyzed": "primary keyword",
    "search_volume": 880,
    "keyword_difficulty": "medium"
  },
  "ideas": [
    {
      "rank": 1,
      "title": "Working title (60-70 characters, include keyword)",
      "keyword": "primary keyword",
      "search_intent": "informational|tutorial|commercial|navigational",
      "angle": "What makes this unique? Why Permamind's perspective matters.",
      "outline": [
        "Introduction: Hook readers with problem/opportunity",
        "Background: Context on [topic area]",
        "Section 1: [Core topic area]",
        "Section 2: [Implementation/approach]",
        "Section 3: [Examples/use cases]",
        "Section 4: [Best practices/gotchas]",
        "Conclusion: Summary + next steps/CTA"
      ],
      "key_points": [
        "Point 1: Specific insight or data",
        "Point 2: Technical implementation detail",
        "Point 3: Practical example or use case"
      ],
      "seo_opportunity_score": 85,
      "brand_fit_score": 92,
      "combined_score": 88.5,
      "rationale": "Why this idea is valuable and feasible",
      "content_gap": "What's missing in existing content",
      "research_needed": [
        "Benchmark performance data",
        "Community feedback on pain points",
        "Competitive analysis of alternative approaches"
      ],
      "estimated_word_count": "2000-2500",
      "target_audience": "Developers building AO processes with AI integration",
      "difficulty_to_write": "medium"
    }
  ],
  "recommendations": {
    "top_3": [
      {
        "rank": 1,
        "idea_title": "Title of #1 idea",
        "why": "Specific reason this is the strongest"
      },
      {
        "rank": 2,
        "idea_title": "Title of #2 idea",
        "why": "Specific reason this is second-best"
      },
      {
        "rank": 3,
        "idea_title": "Title of #3 idea",
        "why": "Specific reason this made top 3"
      }
    ],
    "consider_combining": [
      "Ideas #2 and #5 could form a comprehensive two-part series"
    ],
    "needs_more_research": [
      "Idea #7 requires benchmark data we may not have yet"
    ],
    "alternative_angles": [
      "Instead of focusing on X, could approach from Y perspective"
    ]
  },
  "content_calendar_suggestion": {
    "publish_order": [1, 3, 2, 5, 4],
    "rationale": "Start with foundational content, build to advanced topics",
    "estimated_timeline": "2-3 weeks for top 3 ideas"
  }
}
```

### Markdown Summary

After saving the JSON, output a markdown summary directly in the conversation:

```markdown
# Content Ideas for "{keyword}"

**Generated**: [Date]
**Keyword**: {keyword} (Vol: XXX, Diff: XXX)
**Ideas Generated**: 10

---

## 🏆 Top 3 Recommendations

### 1. [Title] (Score: 88.5/100)
- **SEO Score**: 85 | **Brand Fit**: 92
- **Angle**: What makes this unique
- **Why it's #1**: Specific rationale for top ranking
- **Target Audience**: Developers building [specific use case]
- **Est. Word Count**: 2,000-2,500

**Quick Outline**:
1. Introduction: Hook
2. Background: Context
3. Core sections (3-4)
4. Conclusion: CTA

**Research Needed**:
- Item 1
- Item 2

---

### 2. [Title] (Score: 86.0/100)
[Same structure as #1]

---

### 3. [Title] (Score: 84.5/100)
[Same structure as #1]

---

## 📊 Full Idea List

| Rank | Title | SEO | Brand | Combined | Difficulty |
|------|-------|-----|-------|----------|-----------|
| 1 | [Title] | 85 | 92 | 88.5 | Medium |
| 2 | [Title] | 82 | 90 | 86.0 | Medium |
| 3 | [Title] | 80 | 89 | 84.5 | Low |
| 4 | [Title] | 88 | 80 | 84.0 | High |
| 5 | [Title] | 75 | 88 | 81.5 | Medium |
| 6 | [Title] | 70 | 85 | 77.5 | Low |
| 7 | [Title] | 78 | 75 | 76.5 | Medium |
| 8 | [Title] | 65 | 82 | 73.5 | Low |
| 9 | [Title] | 72 | 70 | 71.0 | High |
| 10 | [Title] | 68 | 72 | 70.0 | Medium |

---

## 💡 Additional Insights

### Consider Combining:
- Ideas #2 and #5 could form a comprehensive guide
- Ideas #3 and #8 cover related concepts

### Needs More Research:
- Idea #7: Requires benchmark data
- Idea #4: Need case study examples

### Alternative Angles:
- Could approach from [perspective X] instead of [perspective Y]
- Consider a comparison piece: [Topic A] vs [Topic B]

### Content Calendar Suggestion:
**Week 1**: Idea #1 (foundational)
**Week 2**: Idea #3 (builds on #1)
**Week 3**: Idea #2 (advanced application)

---

## ✅ Next Steps

1. Review top 3 ideas and select 1-2 to develop
2. Conduct any necessary research (benchmarks, case studies)
3. Create detailed outline for selected idea(s)
4. Draft content with examples and code samples
5. Review against brand voice guidelines
6. Optimize for SEO and publish

**Estimated time to first publish**: 8-12 hours (research 2h, outline 1h, draft 4h, edit 2h, optimize 1h)
```

## Success Criteria

Your output should meet these standards:

- ✅ **Quantity**: Exactly 10 distinct ideas generated
- ✅ **Quality**: 70%+ of ideas viable for development (7+ ideas rated 70+ combined score)
- ✅ **Brand Voice**: Average brand fit score > 80
- ✅ **SEO Value**: Average SEO opportunity score > 70
- ✅ **Uniqueness**: Each idea has distinct angle and value proposition
- ✅ **Actionability**: Outlines are detailed enough to start writing
- ✅ **Technical Accuracy**: All AO/Arweave terminology used correctly
- ✅ **Audience Fit**: Ideas target Permamind's developer/builder audience

## Quality Checks

Before outputting, verify:

1. **Brand Voice Alignment**:
   - Uses collaborative "we" language
   - Includes technical depth with accessibility
   - Avoids hype and buzzwords
   - Credits community where appropriate

2. **Technical Accuracy**:
   - AO terminology correct (process, handler, message)
   - Arweave concepts accurate (Permaweb, permanence)
   - Code examples would be valid
   - Architecture patterns are sound

3. **SEO Optimization**:
   - Title includes target keyword naturally
   - Search intent correctly identified
   - Content gap is realistic
   - Keyword difficulty assessment reasonable

4. **Feasibility**:
   - Permamind has authority to write on topic
   - Required research is obtainable
   - Estimated word count is realistic
   - Timeline is achievable

## Example Usage

**User prompt**:
```
Generate blog post ideas for the keyword "AI agent memory"
```

**Expected process**:
1. Read brand voice guidelines ✓
2. Read target keywords ✓
3. Identify keyword details (Vol: 880, Diff: Medium)
4. Generate 10 ideas with unique angles
5. Score each idea for SEO and brand fit
6. Rank by combined score
7. Output JSON + Markdown summary

**Time to complete**: 60-90 seconds

## Tips for Best Results

- **Specific Keywords**: More specific keywords = better ideas
- **Context**: Provide context if keyword is ambiguous
- **Constraints**: Mention any constraints (e.g., "avoid code-heavy tutorials")
- **Goals**: Share goals (e.g., "need quick win for this week")

## Limitations

This agent:
- ❌ Does NOT research competitor content in real-time
- ❌ Does NOT verify actual search volumes (uses estimates)
- ❌ Does NOT guarantee content will rank (depends on execution)
- ❌ Does NOT write the actual blog post (just ideas)
- ✅ DOES provide informed recommendations based on brand + SEO best practices
- ✅ DOES save significant ideation time (70%+ time savings)

---

**Version**: 1.0
**Last Updated**: 2025-01-15
**Maintained by**: Permamind Team
