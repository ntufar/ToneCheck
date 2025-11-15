/**
 * Message handler foundation
 * Routes messages between content scripts, popup, and background worker
 */

import browser from 'webextension-polyfill';
import type {
  ExtensionMessage,
  ExtensionResponse,
  AnalysisRequest,
  AnalysisResponse,
  SuggestionRequest,
  SuggestionResponse,
  SettingsUpdateRequest,
  SettingsResponse,
  ErrorResponse
} from '../shared/types';
import { MESSAGE_TYPE_ANALYZE, MESSAGE_TYPE_SUGGESTIONS, MESSAGE_TYPE_SETTINGS_GET, MESSAGE_TYPE_SETTINGS_UPDATE } from '../shared/constants';
import { analyzeTone } from './api-client';
import { getSettingsWithDefaults } from './storage';

/**
 * Message handler router
 * Routes incoming messages to appropriate handlers
 */
export async function handleMessage(
  message: ExtensionMessage,
  sender: browser.Runtime.MessageSender
): Promise<ExtensionResponse> {
  try {
    switch (message.type) {
      case MESSAGE_TYPE_ANALYZE:
        return await handleAnalyzeRequest(message.payload as AnalysisRequest);
      
      case MESSAGE_TYPE_SUGGESTIONS:
        return await handleSuggestionsRequest(message.payload as SuggestionRequest);
      
      case MESSAGE_TYPE_SETTINGS_GET:
        return await handleGetSettings();
      
      case MESSAGE_TYPE_SETTINGS_UPDATE:
        return await handleUpdateSettings(message.payload as SettingsUpdateRequest);
      
      default:
        return createErrorResponse('INVALID_REQUEST', `Unknown message type: ${(message as ExtensionMessage).type}`);
    }
  } catch (error) {
    console.error('Error handling message:', error);
    return createErrorResponse(
      'API_ERROR',
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
}

/**
 * Handle analysis request
 * Validates request, checks settings, calls API client, and returns response
 */
async function handleAnalyzeRequest(request: AnalysisRequest): Promise<AnalysisResponse | ErrorResponse> {
  // Validate request
  if (!request.text || request.text.trim().length === 0) {
    return createErrorResponse('INVALID_REQUEST', 'Text cannot be empty');
  }

  if (!request.fieldId || !request.url) {
    return createErrorResponse('INVALID_REQUEST', 'Missing required fields: fieldId, url');
  }

  if (request.text.length > 20000) {
    return createErrorResponse('INVALID_REQUEST', 'Text exceeds maximum length of 20000 characters');
  }

  // Check if extension is enabled
  const settings = await getSettingsWithDefaults();
  if (!settings.extensionEnabled) {
    return createErrorResponse('INVALID_REQUEST', 'Extension is disabled');
  }

  // Check if API key is configured
  if (!settings.apiKeyToneAnalysis) {
    return createErrorResponse('API_KEY_MISSING', 'Perspective API key not configured. Please set up your API key in settings.');
  }

  // Generate request ID
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Call API client
    const result = await analyzeTone(request.text, request.fieldId, requestId);

    // Return analysis response
    return {
      requestId: result.requestId,
      toxicity: result.toxicity,
      severeToxicity: result.severeToxicity,
      identityAttack: result.identityAttack,
      insult: result.insult,
      profanity: result.profanity,
      threat: result.threat,
      overallAggression: result.overallAggression
    };
  } catch (error) {
    // Handle API errors gracefully
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('API key')) {
      return createErrorResponse('API_KEY_MISSING', 'Invalid or missing Perspective API key');
    } else if (errorMessage.includes('Rate limit')) {
      return createErrorResponse('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded. Please wait a moment before trying again.');
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return createErrorResponse('NETWORK_ERROR', 'Network error. Please check your internet connection.');
    } else {
      return createErrorResponse('API_ERROR', `Analysis failed: ${errorMessage}`);
    }
  }
}

/**
 * Handle suggestions request
 * TODO: Implement in Phase 4 (T048-T051)
 */
async function handleSuggestionsRequest(request: SuggestionRequest): Promise<SuggestionResponse | ErrorResponse> {
  // Placeholder - will be implemented in Phase 4
  return createErrorResponse('API_ERROR', 'Suggestions handler not yet implemented');
}

/**
 * Handle get settings request
 * TODO: Implement in Phase 5 (T073)
 */
async function handleGetSettings(): Promise<SettingsResponse | ErrorResponse> {
  // Placeholder - will be implemented in Phase 5
  return createErrorResponse('API_ERROR', 'Get settings handler not yet implemented');
}

/**
 * Handle update settings request
 * TODO: Implement in Phase 5 (T074-T076)
 */
async function handleUpdateSettings(request: SettingsUpdateRequest): Promise<SettingsResponse | ErrorResponse> {
  // Placeholder - will be implemented in Phase 5
  return createErrorResponse('API_ERROR', 'Update settings handler not yet implemented');
}

/**
 * Create an error response
 */
function createErrorResponse(
  error: ErrorResponse['error'],
  message: string,
  details?: Record<string, unknown>
): ErrorResponse {
  return {
    error,
    message,
    ...(details && { details })
  };
}

/**
 * Initialize message listener
 * Sets up the message handler for the extension
 */
export function initializeMessageHandler(): void {
  browser.runtime.onMessage.addListener(
    (message: ExtensionMessage, sender: browser.Runtime.MessageSender) => {
      return handleMessage(message, sender);
    }
  );
}

