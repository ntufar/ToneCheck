/**
 * Content script entry point
 * Coordinates field detection, analysis requests, and UI updates
 */

import browser from 'webextension-polyfill';
import { fieldDetector } from './field-detector';
import { uiInjector } from './ui-injector';
import { showLoadingIndicator, showErrorIndicator, removeToneIndicator } from './tone-indicator';
import type { DetectedField } from './field-detector';
import type { AnalysisRequest, AnalysisResponse, ErrorResponse, SettingsResponse } from '../shared/types';

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Request tone analysis from background worker
 */
async function requestAnalysis(
  text: string,
  field: DetectedField
): Promise<AnalysisResponse | ErrorResponse> {
  const request: AnalysisRequest = {
    text,
    fieldId: field.fieldId,
    url: window.location.href
  };

  try {
    const response = await browser.runtime.sendMessage({
      type: 'analyze',
      payload: request
    });

    return response as AnalysisResponse | ErrorResponse;
  } catch (error) {
    console.error('Error sending analysis request:', error);
    return {
      error: 'NETWORK_ERROR',
      message: error instanceof Error ? error.message : 'Failed to send analysis request'
    };
  }
}

/**
 * Get settings from background worker
 */
async function getSettings(): Promise<SettingsResponse | null> {
  try {
    const response = await browser.runtime.sendMessage({
      type: 'settings/get'
    });
    
    if ('error' in response) {
      console.error('Error getting settings:', response);
      return null;
    }
    
    return response as SettingsResponse;
  } catch (error) {
    console.error('Error requesting settings:', error);
    return null;
  }
}

/**
 * Handle field text change
 */
async function handleFieldChange(field: DetectedField, text: string): Promise<void> {
  // Check if extension is enabled
  const settings = await getSettings();
  if (!settings || !settings.extensionEnabled) {
    return;
  }

  // Check if website is disabled
  const hostname = window.location.hostname.toLowerCase();
  if (settings.disabledWebsites.some(domain => hostname.includes(domain.toLowerCase()))) {
    return;
  }

  // Show loading indicator
  const loadingIndicator = showLoadingIndicator(field.fieldId);
  const fieldRect = field.element.getBoundingClientRect();
  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;
  loadingIndicator.style.position = 'absolute';
  loadingIndicator.style.left = `${fieldRect.right + scrollX + 10}px`;
  loadingIndicator.style.top = `${fieldRect.top + scrollY}px`;
  loadingIndicator.style.zIndex = '10000';
  document.body.appendChild(loadingIndicator);

  try {
    // Request analysis
    const response = await requestAnalysis(text, field);

    // Remove loading indicator
    removeToneIndicator(loadingIndicator);

    // Handle response
    if ('error' in response) {
      // Error response
      const errorIndicator = showErrorIndicator(field.fieldId, response.message);
      const fieldRect = field.element.getBoundingClientRect();
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;
      errorIndicator.style.position = 'absolute';
      errorIndicator.style.left = `${fieldRect.right + scrollX + 10}px`;
      errorIndicator.style.top = `${fieldRect.top + scrollY}px`;
      errorIndicator.style.zIndex = '10000';
      document.body.appendChild(errorIndicator);
    } else {
      // Success response - update indicator
      uiInjector.updateIndicator(field, {
        requestId: response.requestId,
        fieldId: field.fieldId,
        timestamp: Date.now(),
        toxicity: response.toxicity,
        severeToxicity: response.severeToxicity,
        identityAttack: response.identityAttack,
        insult: response.insult,
        profanity: response.profanity,
        threat: response.threat,
        overallAggression: response.overallAggression
      });
    }
  } catch (error) {
    // Remove loading indicator
    removeToneIndicator(loadingIndicator);

    // Show error
    const errorIndicator = showErrorIndicator(
      field.fieldId,
      error instanceof Error ? error.message : 'Analysis failed'
    );
    const fieldRect = field.element.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    errorIndicator.style.position = 'absolute';
    errorIndicator.style.left = `${fieldRect.right + scrollX + 10}px`;
    errorIndicator.style.top = `${fieldRect.top + scrollY}px`;
    errorIndicator.style.zIndex = '10000';
    document.body.appendChild(errorIndicator);
  }
}

/**
 * Initialize content script
 */
function initialize(): void {
  // Register field change handler
  fieldDetector.onFieldChange(handleFieldChange);

  // Initialize field detection
  fieldDetector.initialize();

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    fieldDetector.cleanup();
    uiInjector.cleanup();
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

