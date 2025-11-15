/**
 * API client for Perspective API
 * Handles tone analysis requests with authentication, error handling, and chunking
 */

import { PERSPECTIVE_API_URL, MAX_TEXT_LENGTH, CHUNK_SIZE } from '../shared/constants';
import type { ToneAnalysisResult } from '../shared/types';
import { getToneAnalysisApiKey } from './storage';
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
      throw new Error('Invalid request to Perspective API');
    } else if (response.status === 401) {
      throw new Error('Invalid Perspective API key');
    } else if (response.status === 429) {
      throw new Error('Rate limit exceeded for Perspective API');
    } else if (response.status === 500) {
      throw new Error('Perspective API server error');
    } else {
      throw new Error(`Perspective API error: ${response.status} ${response.statusText}`);
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

