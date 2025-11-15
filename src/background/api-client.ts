/**
 * API client for Perspective API, Claude API, and Gemini API
 * Handles tone analysis requests and suggestion generation with authentication, error handling, and chunking
 */

import { PERSPECTIVE_API_URL, CLAUDE_API_URL, GEMINI_API_URL, MAX_TEXT_LENGTH, CHUNK_SIZE } from '../shared/constants';
import type { ToneAnalysisResult } from '../shared/types';
import { getToneAnalysisApiKey, getSuggestionsApiKey } from './storage';
import { rateLimiter } from './rate-limiter';

interface PerspectiveApiResponse {
  attributeScores: {
    TOXICITY?: { summaryScore: { value: number } };
    SEVERE_TOXICITY?: { summaryScore: { value: number } };
    IDENTITY_ATTACK?: { summaryScore: { value: number } };
    INSULT?: { summaryScore: { value: number } };
    PROFANITY?: { summaryScore: { value: number } };
    THREAT?: { summaryScore: { value: number } };
  };
}

/**
 * Analyze text tone using Perspective API
 * @param text - Text to analyze
 * @param fieldId - Field identifier
 * @param requestId - Request identifier
 * @returns ToneAnalysisResult
 */
export async function analyzeTone(
  text: string,
  fieldId: string,
  requestId: string
): Promise<ToneAnalysisResult> {
  // Validate input
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  if (text.length > MAX_TEXT_LENGTH) {
    throw new Error(`Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters`);
  }

  // Get API key
  const apiKey = await getToneAnalysisApiKey();
  if (!apiKey) {
    throw new Error('Perspective API key not configured');
  }
  
  // Log API key status (without exposing the key)
  console.log('Using Perspective API key (length:', apiKey.length, 'chars)');

  // Handle chunking for text >3000 characters
  if (text.length > CHUNK_SIZE) {
    return await analyzeChunkedText(text, fieldId, requestId, apiKey);
  }

  // Execute API request through rate limiter
  const result = await rateLimiter.enqueue(async () => {
    return await callPerspectiveAPI(text, apiKey);
  });

  return parseApiResponse(result, fieldId, requestId);
}

/**
 * Call Perspective API directly
 */
async function callPerspectiveAPI(text: string, apiKey: string): Promise<PerspectiveApiResponse> {
  const requestBody = {
    comment: {
      text: text
    },
    requestedAttributes: {
      TOXICITY: {},
      SEVERE_TOXICITY: {},
      IDENTITY_ATTACK: {},
      INSULT: {},
      PROFANITY: {},
      THREAT: {}
    },
    languages: ['en'],
    doNotStore: true
  };

  const url = `${PERSPECTIVE_API_URL}?key=${encodeURIComponent(apiKey)}`;
  
  console.log('Calling Perspective API:', {
    url: PERSPECTIVE_API_URL,
    apiKeyLength: apiKey.length,
    textLength: text.length,
    hasApiKey: !!apiKey
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  // Handle error responses
  if (!response.ok) {
    // Try to get error details from response body
    let errorDetails = '';
    let errorCode = '';
    try {
      const errorBody = await response.json();
      console.error('Perspective API error response:', errorBody);
      errorDetails = errorBody.error?.message || errorBody.message || JSON.stringify(errorBody);
      errorCode = errorBody.error?.code || errorBody.code || '';
    } catch (e) {
      // If JSON parsing fails, try to get text
      try {
        const text = await response.text();
        errorDetails = text || response.statusText;
        console.error('Perspective API error (non-JSON):', text);
      } catch {
        errorDetails = response.statusText;
      }
    }
    
    console.error('Perspective API error:', {
      status: response.status,
      statusText: response.statusText,
      errorDetails,
      errorCode,
      url: url.split('?')[0] // Don't log the API key
    });
    
    if (response.status === 400) {
      throw new Error(`Invalid request to Perspective API: ${errorDetails}`);
    } else if (response.status === 401) {
      throw new Error('Invalid Perspective API key. Please check your API key in settings.');
    } else if (response.status === 403) {
      // 403 usually means API not enabled or key restrictions
      const helpfulMessage = errorDetails.includes('API_KEY_NOT_FOUND') || errorDetails.includes('not found')
        ? 'Your API key was not found. Please verify you copied the correct key from https://developers.perspectiveapi.com/'
        : errorDetails.includes('PERMISSION_DENIED') || errorDetails.includes('permission')
        ? 'Your API key does not have permission to access Perspective API. Please enable the Perspective API in your Google Cloud project.'
        : errorDetails.includes('API_KEY_INVALID') || errorDetails.includes('invalid')
        ? 'Your API key is invalid. Please check your API key in settings.'
        : `Perspective API access forbidden (403). This usually means:
- The Perspective API is not enabled in your Google Cloud project
- Your API key doesn't have the required permissions
- The API key is restricted and doesn't allow this API

Error details: ${errorDetails}

To fix this:
1. Go to https://console.cloud.google.com/apis/library
2. Search for "Perspective API" and enable it
3. Or go to https://developers.perspectiveapi.com/ and get a new API key`;
      
      throw new Error(helpfulMessage);
    } else if (response.status === 429) {
      throw new Error('Rate limit exceeded for Perspective API. Please wait a moment before trying again.');
    } else if (response.status === 500) {
      throw new Error('Perspective API server error. Please try again later.');
    } else {
      throw new Error(`Perspective API error (${response.status}): ${errorDetails}`);
    }
  }

  return await response.json() as PerspectiveApiResponse;
}

/**
 * Analyze chunked text (for text >3000 characters)
 */
async function analyzeChunkedText(
  text: string,
  fieldId: string,
  requestId: string,
  apiKey: string
): Promise<ToneAnalysisResult> {
  // Split text into chunks
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
  }

  // Analyze each chunk
  const chunkResults: ToneAnalysisResult[] = [];
  for (const chunk of chunks) {
    const result = await rateLimiter.enqueue(async () => {
      return await callPerspectiveAPI(chunk, apiKey);
    });
    chunkResults.push(parseApiResponse(result, fieldId, `${requestId}-chunk-${chunks.indexOf(chunk)}`));
  }

  // Aggregate results (take maximum scores across chunks)
  return aggregateChunkResults(chunkResults, fieldId, requestId);
}

/**
 * Aggregate chunk results by taking maximum scores
 */
function aggregateChunkResults(
  results: ToneAnalysisResult[],
  fieldId: string,
  requestId: string
): ToneAnalysisResult {
  return {
    requestId,
    fieldId,
    timestamp: Date.now(),
    toxicity: Math.max(...results.map(r => r.toxicity)),
    severeToxicity: Math.max(...results.map(r => r.severeToxicity)),
    identityAttack: Math.max(...results.map(r => r.identityAttack)),
    insult: Math.max(...results.map(r => r.insult)),
    profanity: Math.max(...results.map(r => r.profanity)),
    threat: Math.max(...results.map(r => r.threat)),
    overallAggression: Math.max(...results.map(r => r.overallAggression))
  };
}

/**
 * Parse Perspective API response into ToneAnalysisResult
 */
function parseApiResponse(
  response: PerspectiveApiResponse,
  fieldId: string,
  requestId: string
): ToneAnalysisResult {
  const scores = response.attributeScores;

  const toxicity = scores.TOXICITY?.summaryScore?.value ?? 0;
  const severeToxicity = scores.SEVERE_TOXICITY?.summaryScore?.value ?? 0;
  const identityAttack = scores.IDENTITY_ATTACK?.summaryScore?.value ?? 0;
  const insult = scores.INSULT?.summaryScore?.value ?? 0;
  const profanity = scores.PROFANITY?.summaryScore?.value ?? 0;
  const threat = scores.THREAT?.summaryScore?.value ?? 0;

  // Calculate overall aggression: max(toxicity, insult, threat) * 100
  const overallAggression = Math.max(toxicity, insult, threat) * 100;

  return {
    requestId,
    fieldId,
    timestamp: Date.now(),
    toxicity,
    severeToxicity,
    identityAttack,
    insult,
    profanity,
    threat,
    overallAggression
  };
}

// ============================================================================
// Suggestion API Clients (Phase 4 - US2)
// ============================================================================

interface ClaudeApiResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
}

interface GeminiApiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

/**
 * Build suggestion prompt for Claude or Gemini API
 * @param originalText - The text that was flagged
 * @param flaggedAttributes - Attributes that triggered the flag (toxicity, insult, threat, profanity)
 * @param aggressionScore - Overall aggression percentage
 * @returns Formatted prompt string
 */
export function buildSuggestionPrompt(
  originalText: string,
  flaggedAttributes: ('toxicity' | 'insult' | 'threat' | 'profanity')[],
  aggressionScore?: number
): string {
  const context = aggressionScore 
    ? `[Context: This text was flagged for: ${flaggedAttributes.join(', ')} with an overall aggression score of ${Math.round(aggressionScore)}%]`
    : `[Context: This text was flagged for: ${flaggedAttributes.join(', ')}]`;

  return `The following text was flagged as potentially aggressive. Please provide 2-3 alternative phrasings that maintain the original intent but use a more appropriate, professional tone:

${originalText}

${context}

Provide only the alternative phrasings, one per line, without explanations.`;
}

/**
 * Generate suggestions using Claude API
 * @param text - Original text to rewrite
 * @param flaggedAttributes - Attributes that triggered the flag
 * @param aggressionScore - Overall aggression percentage
 * @returns Array of 2-3 alternative suggestions
 */
export async function generateSuggestionsClaude(
  text: string,
  flaggedAttributes: ('toxicity' | 'insult' | 'threat' | 'profanity')[],
  aggressionScore?: number
): Promise<string[]> {
  // Get API key
  const apiKey = await getSuggestionsApiKey();
  if (!apiKey) {
    throw new Error('Claude API key not configured');
  }

  // Build prompt
  const userMessage = buildSuggestionPrompt(text, flaggedAttributes, aggressionScore);
  
  const requestBody = {
    model: 'claude-3-haiku-20240307',
    max_tokens: 500,
    system: 'You are a helpful assistant that rewrites text to maintain the original intent while improving tone. Your goal is to make text sound more professional, respectful, and less aggressive without changing the core message.',
    messages: [
      {
        role: 'user' as const,
        content: userMessage
      }
    ]
  };

  // Execute API request through rate limiter
  const response = await rateLimiter.enqueue(async () => {
    return await callClaudeAPI(requestBody, apiKey);
  });

  return parseClaudeSuggestions(response);
}

/**
 * Call Claude API directly
 */
async function callClaudeAPI(
  requestBody: {
    model: string;
    max_tokens: number;
    system: string;
    messages: Array<{ role: 'user'; content: string }>;
  },
  apiKey: string
): Promise<ClaudeApiResponse> {
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(requestBody)
  });

  // Handle error responses
  if (!response.ok) {
    if (response.status === 400) {
      throw new Error('Invalid request to Claude API');
    } else if (response.status === 401) {
      throw new Error('Invalid Claude API key');
    } else if (response.status === 429) {
      throw new Error('Rate limit exceeded for Claude API');
    } else if (response.status === 500) {
      throw new Error('Claude API server error');
    } else {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }
  }

  return await response.json() as ClaudeApiResponse;
}

/**
 * Parse Claude API response to extract suggestions
 */
function parseClaudeSuggestions(response: ClaudeApiResponse): string[] {
  if (!response.content || response.content.length === 0) {
    throw new Error('No suggestions returned from Claude API');
  }

  // Extract text from first content block
  const textContent = response.content[0]?.text;
  if (!textContent) {
    throw new Error('Empty response from Claude API');
  }

  // Parse suggestions (one per line)
  const suggestions = textContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    // Remove numbered prefixes (e.g., "1. ", "2. ", etc.)
    .map(line => line.replace(/^\d+\.\s*/, ''))
    .slice(0, 3); // Limit to 3 suggestions

  if (suggestions.length < 2) {
    throw new Error('Insufficient suggestions returned from Claude API');
  }

  return suggestions;
}

/**
 * Generate suggestions using Gemini API
 * @param text - Original text to rewrite
 * @param flaggedAttributes - Attributes that triggered the flag
 * @param aggressionScore - Overall aggression percentage
 * @returns Array of 2-3 alternative suggestions
 */
export async function generateSuggestionsGemini(
  text: string,
  flaggedAttributes: ('toxicity' | 'insult' | 'threat' | 'profanity')[],
  aggressionScore?: number
): Promise<string[]> {
  // Get API key
  const apiKey = await getSuggestionsApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  // Build prompt
  const prompt = `You are a helpful assistant that rewrites text to maintain the original intent while improving tone. Your goal is to make text sound more professional, respectful, and less aggressive without changing the core message.

${buildSuggestionPrompt(text, flaggedAttributes, aggressionScore)}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 500
    }
  };

  // Execute API request through rate limiter
  const response = await rateLimiter.enqueue(async () => {
    return await callGeminiAPI(requestBody, apiKey);
  });

  return parseGeminiSuggestions(response);
}

/**
 * Call Gemini API directly
 */
async function callGeminiAPI(
  requestBody: {
    contents: Array<{ parts: Array<{ text: string }> }>;
    generationConfig: { temperature: number; maxOutputTokens: number };
  },
  apiKey: string
): Promise<GeminiApiResponse> {
  const url = `${GEMINI_API_URL}?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  // Handle error responses
  if (!response.ok) {
    if (response.status === 400) {
      throw new Error('Invalid request to Gemini API');
    } else if (response.status === 401) {
      throw new Error('Invalid Gemini API key');
    } else if (response.status === 429) {
      throw new Error('Rate limit exceeded for Gemini API');
    } else if (response.status === 500) {
      throw new Error('Gemini API server error');
    } else {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }
  }

  return await response.json() as GeminiApiResponse;
}

/**
 * Parse Gemini API response to extract suggestions
 */
function parseGeminiSuggestions(response: GeminiApiResponse): string[] {
  if (!response.candidates || response.candidates.length === 0) {
    throw new Error('No suggestions returned from Gemini API');
  }

  const candidate = response.candidates[0];
  if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
    throw new Error('Empty response from Gemini API');
  }

  // Extract text from first part
  const textContent = candidate.content.parts[0]?.text;
  if (!textContent) {
    throw new Error('Empty text in Gemini API response');
  }

  // Parse suggestions (one per line)
  const suggestions = textContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    // Remove numbered prefixes (e.g., "1. ", "2. ", etc.)
    .map(line => line.replace(/^\d+\.\s*/, ''))
    .slice(0, 3); // Limit to 3 suggestions

  if (suggestions.length < 2) {
    throw new Error('Insufficient suggestions returned from Gemini API');
  }

  return suggestions;
}

/**
 * Generate suggestions using the configured provider (Claude or Gemini)
 * @param text - Original text to rewrite
 * @param flaggedAttributes - Attributes that triggered the flag
 * @param aggressionScore - Overall aggression percentage
 * @param provider - Provider to use ('claude' or 'gemini')
 * @returns Array of 2-3 alternative suggestions
 */
export async function generateSuggestions(
  text: string,
  flaggedAttributes: ('toxicity' | 'insult' | 'threat' | 'profanity')[],
  aggressionScore?: number,
  provider: 'claude' | 'gemini' = 'gemini'
): Promise<string[]> {
  try {
    if (provider === 'claude') {
      return await generateSuggestionsClaude(text, flaggedAttributes, aggressionScore);
    } else {
      return await generateSuggestionsGemini(text, flaggedAttributes, aggressionScore);
    }
  } catch (error) {
    // Handle timeout and rate limit errors gracefully
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
      throw new Error('Suggestion generation timed out. Please try again.');
    } else if (errorMessage.includes('Rate limit')) {
      throw new Error('Rate limit exceeded. Please wait a moment before requesting suggestions.');
    } else {
      throw error;
    }
  }
}

