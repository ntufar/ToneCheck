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
import { MESSAGE_TYPE_ANALYZE, MESSAGE_TYPE_SUGGESTIONS, MESSAGE_TYPE_SETTINGS_GET, MESSAGE_TYPE_SETTINGS_UPDATE, SENSITIVITY_THRESHOLDS } from '../shared/constants';
import { analyzeTone, generateSuggestions } from './api-client';
import { getSettingsWithDefaults, updateSettings } from './storage';

/**
 * Message handler router
 * Routes incoming messages to appropriate handlers
 */
export async function handleMessage(
  message: ExtensionMessage,
  sender: browser.Runtime.MessageSender
): Promise<ExtensionResponse> {
  console.log('handleMessage called with type:', message.type);
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
    // T088: Handle extension disabled during analysis (graceful cancellation)
    return createErrorResponse('EXTENSION_DISABLED', 'Extension is disabled');
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
 * Validates request, checks settings, calls appropriate suggestion provider, and returns response
 */
async function handleSuggestionsRequest(request: SuggestionRequest): Promise<SuggestionResponse | ErrorResponse> {
  // Validate request
  if (!request.text || request.text.trim().length === 0) {
    return createErrorResponse('INVALID_REQUEST', 'Text cannot be empty');
  }

  if (!request.flaggedAttributes || request.flaggedAttributes.length === 0) {
    return createErrorResponse('INVALID_REQUEST', 'At least one flagged attribute is required');
  }

  if (!request.requestId) {
    return createErrorResponse('INVALID_REQUEST', 'Request ID is required');
  }

  // Check if extension is enabled
  const settings = await getSettingsWithDefaults();
  if (!settings.extensionEnabled) {
    return createErrorResponse('INVALID_REQUEST', 'Extension is disabled');
  }

  // Check if suggestion API key is configured
  if (!settings.apiKeySuggestions) {
    return createErrorResponse('API_KEY_MISSING', 'Suggestion API key not configured. Please set up your API key in settings.');
  }

  // Get provider from settings
  const provider = settings.suggestionProvider || 'gemini';

  try {
    // Call suggestion API client
    const suggestions = await generateSuggestions(
      request.text,
      request.flaggedAttributes,
      request.aggressionScore,
      provider
    );

    // Return suggestion response
    return {
      suggestions
    };
  } catch (error) {
    // Handle API errors gracefully
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('API key')) {
      return createErrorResponse('API_KEY_MISSING', `Invalid or missing ${provider} API key`);
    } else if (errorMessage.includes('Rate limit')) {
      return createErrorResponse('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded. Please wait a moment before requesting suggestions.');
    } else if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
      return createErrorResponse('NETWORK_ERROR', 'Network error. Please check your internet connection.');
    } else {
      return createErrorResponse('API_ERROR', `Suggestion generation failed: ${errorMessage}`);
    }
  }
}

/**
 * Handle get settings request
 * Returns current user settings (API keys are not decrypted in response)
 */
async function handleGetSettings(): Promise<SettingsResponse | ErrorResponse> {
  try {
    const settings = await getSettingsWithDefaults();

    // Return settings response (API keys are encrypted, so we return null to indicate they're set)
    return {
      apiKeyToneAnalysis: settings.apiKeyToneAnalysis ? null : undefined, // null = configured, undefined = not set
      apiKeySuggestions: settings.apiKeySuggestions ? null : undefined,
      suggestionProvider: settings.suggestionProvider,
      sensitivityThreshold: settings.sensitivityThreshold,
      disabledWebsites: settings.disabledWebsites,
      extensionEnabled: settings.extensionEnabled,
      lastUpdated: settings.lastUpdated
    };
  } catch (error) {
    console.error('Error getting settings:', error);
    return createErrorResponse(
      'API_ERROR',
      error instanceof Error ? error.message : 'Failed to get settings'
    );
  }
}

/**
 * Handle update settings request
 * Validates settings, encrypts API keys, and saves to storage
 */
async function handleUpdateSettings(request: SettingsUpdateRequest): Promise<SettingsResponse | ErrorResponse> {
  try {
    console.log('handleUpdateSettings called with:', { ...request, apiKeyToneAnalysis: request.apiKeyToneAnalysis ? '***' : undefined, apiKeySuggestions: request.apiKeySuggestions ? '***' : undefined });
    
    // Validate settings
    const validationError = validateSettings(request);
    if (validationError) {
      console.error('Settings validation error:', validationError);
      return createErrorResponse('INVALID_REQUEST', validationError);
    }

    // Update settings (encryption is handled in updateSettings function)
    // Convert null to undefined for API keys (updateSettings expects undefined, not null)
    const updateRequest: Partial<import('../shared/types').UserSettings> = {
      ...request,
      apiKeyToneAnalysis: request.apiKeyToneAnalysis === null ? undefined : request.apiKeyToneAnalysis,
      apiKeySuggestions: request.apiKeySuggestions === null ? undefined : request.apiKeySuggestions
    };
    
    console.log('Calling updateSettings with:', { ...updateRequest, apiKeyToneAnalysis: updateRequest.apiKeyToneAnalysis ? '***' : undefined, apiKeySuggestions: updateRequest.apiKeySuggestions ? '***' : undefined });
    
    const updatedSettings = await updateSettings(updateRequest);
    
    console.log('Settings updated successfully');

    // Return settings response
    return {
      apiKeyToneAnalysis: updatedSettings.apiKeyToneAnalysis ? null : undefined,
      apiKeySuggestions: updatedSettings.apiKeySuggestions ? null : undefined,
      suggestionProvider: updatedSettings.suggestionProvider,
      sensitivityThreshold: updatedSettings.sensitivityThreshold,
      disabledWebsites: updatedSettings.disabledWebsites,
      extensionEnabled: updatedSettings.extensionEnabled,
      lastUpdated: updatedSettings.lastUpdated
    };
  } catch (error) {
    console.error('Error updating settings:', error);
    return createErrorResponse(
      'API_ERROR',
      error instanceof Error ? error.message : 'Failed to update settings'
    );
  }
}

/**
 * Validate settings update request
 */
function validateSettings(request: SettingsUpdateRequest): string | null {
  // Validate sensitivity threshold
  if (request.sensitivityThreshold !== undefined) {
    if (!['low', 'medium', 'high'].includes(request.sensitivityThreshold)) {
      return 'Invalid sensitivity threshold. Must be one of: low, medium, high';
    }
  }

  // Validate suggestion provider
  if (request.suggestionProvider !== undefined) {
    if (!['claude', 'gemini'].includes(request.suggestionProvider)) {
      return 'Invalid suggestion provider. Must be one of: claude, gemini';
    }
  }

  // Validate extension enabled
  if (request.extensionEnabled !== undefined) {
    if (typeof request.extensionEnabled !== 'boolean') {
      return 'Extension enabled must be a boolean';
    }
  }

  // Validate disabled websites
  if (request.disabledWebsites !== undefined) {
    if (!Array.isArray(request.disabledWebsites)) {
      return 'Disabled websites must be an array';
    }

    // Validate each website domain
    for (const website of request.disabledWebsites) {
      if (typeof website !== 'string' || website.trim().length === 0) {
        return 'Invalid website domain. Must be a non-empty string';
      }

      // Basic domain validation (allow simple domain format)
      const domainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!domainPattern.test(website.trim())) {
        return `Invalid website domain format: ${website}`;
      }
    }
  }

  return null;
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
    (message: unknown, sender: browser.Runtime.MessageSender) => {
      return handleMessage(message as ExtensionMessage, sender);
    }
  );
}

