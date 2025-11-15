# Research: ToneCheck Browser Extension MVP

**Date**: 2025-01-21  
**Phase**: 0 - Outline & Research  
**Purpose**: Resolve technical clarifications identified in implementation plan

## Research Tasks

### 1. Tone Analysis API Selection and Integration

**Question**: Which specific API should be used for tone analysis, and how should it be integrated?

**Research Findings**:

**Decision**: Use **Perspective API** (by Jigsaw/Google) as the primary tone analysis service.

**Rationale**:
- **Purpose-built for toxicity detection**: Perspective API is specifically designed for detecting toxic comments and analyzing conversation tone
- **Multiple attribute support**: Provides scores for toxicity, severe_toxicity, identity_attack, insult, profanity, threat - aligns with requirements (FR-003)
- **Free tier available**: Offers free API access with rate limits suitable for individual users
- **Well-documented**: Comprehensive API documentation and examples
- **REST API**: Simple HTTP integration suitable for browser extensions
- **Response time**: Typically <300ms, meeting <500ms requirement
- **Privacy-conscious**: API designed for user-provided content analysis

**Alternatives Considered**:
- **AWS Comprehend**: Enterprise-focused, requires AWS account setup, more complex for individual users
- **Azure Text Analytics**: Similar enterprise focus, requires Azure subscription
- **Custom ML model**: Too complex for MVP, requires infrastructure and training data
- **OpenAI Moderation API**: Limited to moderation categories, less nuanced than Perspective API

**Integration Approach**:
- Use REST API endpoint: `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze`
- Send POST requests with text content and requested attributes
- Handle API key authentication via user-provided API key
- Implement retry logic with exponential backoff for transient failures
- Cache API responses temporarily (in-memory only, cleared after analysis) to reduce redundant calls

**API Limits**:
- Free tier: 1 request per second (aligns with requirement FR-029)
- Paid tiers available for higher throughput if needed
- Text length limit: 20,000 characters (sufficient for chunked analysis of 3000+ character texts)

**References**:
- Perspective API Documentation: https://developers.perspectiveapi.com/s/docs
- API Reference: https://developers.perspectiveapi.com/s/about-the-api

---

### 2. Suggestion Generation Service and Prompt Design

**Question**: Which AI/LLM service should generate alternative phrasings, and how should prompts be designed?

**Research Findings**:

**Decision**: Support **both Anthropic Claude API** (Claude 3 Haiku) and **Google Gemini API** (Gemini 1.5 Flash) for suggestion generation. Users can choose their preferred provider based on cost and availability.

**Primary Option - Claude API (Claude 3 Haiku)**:
- **Cost-effective**: Claude 3 Haiku offers best price/performance for text rewriting tasks
- **Fast response times**: Typically <500ms for short text rewrites, meeting performance requirements
- **Context-aware**: Strong understanding of tone, intent preservation, and natural language
- **Privacy-focused**: Anthropic has strong privacy policies, suitable for user content
- **API simplicity**: Clean REST API with straightforward authentication
- **Quality output**: Produces natural, contextually appropriate rewrites

**Alternative Option - Gemini API (Gemini 1.5 Flash)**:
- **Free tier available**: Google offers free tier with generous quotas, making it accessible for users
- **Fast response times**: Typically <500ms for short text rewrites, comparable to Claude
- **Cost-effective**: Free tier sufficient for individual use, paid tiers available if needed
- **Good quality**: Strong performance on text rewriting tasks
- **API simplicity**: REST API with straightforward authentication
- **Widely available**: Google's infrastructure ensures good availability

**Alternatives Considered**:
- **OpenAI GPT-4**: Higher cost, slower response times, overkill for simple rewrites
- **OpenAI GPT-3.5 Turbo**: Good alternative, but Claude Haiku and Gemini Flash offer better price/performance
- **Local LLM (e.g., Ollama)**: Privacy benefits but requires significant setup, slower inference, not suitable for MVP
- **Template-based rewrites**: Too rigid, cannot handle context and nuance

**Integration Approach**:

**Claude API**:
- Use Claude API endpoint: `https://api.anthropic.com/v1/messages`
- Send POST requests with system prompt and user message containing original text
- Implement streaming for better UX (optional for MVP, can add later)
- Handle API key authentication via user-provided API key
- Implement timeout handling (5s timeout) and graceful degradation

**Gemini API**:
- Use Gemini API endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
- Send POST requests with prompt containing original text and context
- Handle API key authentication via user-provided API key (query parameter)
- Implement timeout handling (5s timeout) and graceful degradation

**Prompt Design**:

**Claude API Prompt**:
```
System: You are a helpful assistant that rewrites text to maintain the original intent while improving tone. Your goal is to make text sound more professional, respectful, and less aggressive without changing the core message.

User: The following text was flagged as potentially aggressive. Please provide 2-3 alternative phrasings that maintain the original intent but use a more appropriate, professional tone:

[Original text here]

[Context: This text was flagged for: [toxicity/insult/threat/profanity] with a score of [X]%]

Provide only the alternative phrasings, one per line, without explanations.
```

**Gemini API Prompt**:
```
You are a helpful assistant that rewrites text to maintain the original intent while improving tone. Your goal is to make text sound more professional, respectful, and less aggressive without changing the core message.

The following text was flagged as potentially aggressive. Please provide 2-3 alternative phrasings that maintain the original intent but use a more appropriate, professional tone:

[Original text here]

[Context: This text was flagged for: [toxicity/insult/threat/profanity] with a score of [X]%]

Provide only the alternative phrasings, one per line, without explanations.
```

**API Limits**:

**Claude API**:
- Rate limits: Varies by tier, but sufficient for individual user use cases
- Token limits: 200,000 tokens (more than sufficient for text rewriting)
- Cost: ~$0.25 per 1M input tokens, ~$1.25 per 1M output tokens (very affordable for rewrites)

**Gemini API**:
- Free tier: 15 requests per minute (RPM), sufficient for individual use
- Token limits: 1M tokens per request (more than sufficient for text rewriting)
- Cost: Free tier available, paid tiers start at $0.075 per 1M input tokens, $0.30 per 1M output tokens
- Very cost-effective option for users

**References**:
- Claude API Documentation: https://docs.anthropic.com/claude/reference
- Claude Pricing: https://www.anthropic.com/pricing
- Gemini API Documentation: https://ai.google.dev/docs
- Gemini Pricing: https://ai.google.dev/pricing

---

### 3. Testing Framework for WebExtension Content Scripts and Background Workers

**Question**: What testing framework and setup should be used for testing content scripts and background workers?

**Research Findings**:

**Decision**: Use **Jest** with **@webextension-polyfill/testing** and **jsdom** for WebExtension testing.

**Rationale**:
- **Jest**: Industry-standard JavaScript testing framework, excellent TypeScript support, rich mocking capabilities
- **@webextension-polyfill/testing**: Provides mock implementations of WebExtension APIs (`browser.storage`, `browser.runtime`, etc.) for testing
- **jsdom**: Simulates DOM environment for content script testing without requiring actual browser
- **Sinon**: For advanced mocking and spying (can be used with Jest)
- **Puppeteer/Playwright**: For integration tests that require actual browser (optional, for Phase 2)

**Alternatives Considered**:
- **Mocha + Chai**: More verbose setup, less built-in features than Jest
- **Vitest**: Faster than Jest but less mature ecosystem for WebExtension testing
- **Browser-based testing only**: Too slow for unit tests, better suited for integration tests
- **Karma**: Legacy tool, not recommended for modern projects

**Testing Setup Structure**:

**Unit Tests**:
- Background worker: Mock `browser.storage`, `browser.runtime`, and fetch API
- Content scripts: Use jsdom to simulate DOM, mock `browser.runtime.sendMessage`
- Utilities: Standard Jest unit tests

**Integration Tests**:
- Use Puppeteer or Playwright to load extension in test browser
- Test actual content script injection and UI rendering
- Test background worker message passing
- Test popup/options page interactions

**Contract Tests**:
- Mock API responses for Perspective API and Claude API
- Test API client error handling, rate limiting, retry logic
- Verify request/response formats match API specifications

**Example Test Structure**:
```typescript
// tests/unit/background/api-client.test.ts
import { analyzeTone } from '../../src/background/api-client';
import { browser } from '@webextension-polyfill/testing';

describe('API Client', () => {
  beforeEach(() => {
    browser.storage.local.get.mockResolvedValue({ apiKey: 'test-key' });
  });

  it('should analyze tone via Perspective API', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ attributeScores: { TOXICITY: { summaryScore: { value: 0.7 } } } })
    });

    const result = await analyzeTone('test text');
    expect(result.toxicity).toBe(0.7);
  });
});
```

**References**:
- Jest Documentation: https://jestjs.io/
- @webextension-polyfill: https://github.com/mozilla/webextension-polyfill
- WebExtension Testing Best Practices: https://extensionworkshop.com/documentation/develop/testing/

---

## Summary of Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| Tone Analysis API | Perspective API | Purpose-built, free tier, fast, well-documented |
| Suggestion Service | Claude 3 Haiku API or Gemini 1.5 Flash API | User choice: Claude (paid, high quality) or Gemini (free tier available, cost-effective) |
| Testing Framework | Jest + @webextension-polyfill + jsdom | Industry standard, good WebExtension support, comprehensive mocking |

## Next Steps

All technical clarifications have been resolved. Proceed to Phase 1: Design & Contracts to generate:
- `data-model.md`: Entity definitions and relationships
- `contracts/`: API contracts (OpenAPI schemas for Perspective API and Claude API integration)
- `quickstart.md`: Developer setup and quick start guide

