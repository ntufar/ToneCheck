/**
 * Content script entry point
 * Coordinates field detection, analysis requests, and UI updates
 */

import browser from 'webextension-polyfill';
import { fieldDetector } from './field-detector';
import { uiInjector } from './ui-injector';
import { 
  showLoadingIndicator, 
  showErrorIndicator, 
  removeToneIndicator,
  createReviewInterface,
  replaceTextInField
} from './tone-indicator';
import type { DetectedField } from './field-detector';
import type { AnalysisRequest, AnalysisResponse, ErrorResponse, SettingsResponse, ToneAnalysisResult } from '../shared/types';
import { INDICATOR_THRESHOLDS, SENSITIVITY_THRESHOLDS } from '../shared/constants';

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
    const response = (await browser.runtime.sendMessage({
      type: 'analyze',
      payload: request
    })) as AnalysisResponse | ErrorResponse;

    return response;
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
    const response = (await browser.runtime.sendMessage({
      type: 'settings/get'
    })) as SettingsResponse | ErrorResponse;
    
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
  // Get settings
  const settings = await getSettings();
  if (!settings) {
    return; // Settings not available
  }

  // T088: Check if extension is disabled during analysis (graceful cancellation)
  // Re-check settings to handle case where extension is disabled during analysis
  const currentSettings = await getSettings();
  if (!currentSettings || !currentSettings.extensionEnabled) {
    return; // Extension disabled, cancel gracefully
  }

  // Check if website is disabled
  const hostname = window.location.hostname.toLowerCase();
  if (settings.disabledWebsites && settings.disabledWebsites.some(domain => hostname.includes(domain.toLowerCase()))) {
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
      // Success response - create result object
      const result: ToneAnalysisResult = {
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
      };

      // Update indicator
      uiInjector.updateIndicator(field, result);

      // Check if message should be flagged (above sensitivity threshold)
      // Get settings again to ensure we have the latest threshold
      const currentSettings = await getSettings();
      const threshold = currentSettings?.sensitivityThreshold || 'medium';
      const aggressionThreshold = SENSITIVITY_THRESHOLDS[threshold];
      
      if (result.overallAggression >= aggressionThreshold) {
        // Show review interface with suggestions
        showReviewInterface(field, text, result);
      }
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
 * Show review interface when message is flagged
 */
function showReviewInterface(
  field: DetectedField,
  originalText: string,
  result: ToneAnalysisResult
): void {
  createReviewInterface({
    fieldId: field.fieldId,
    fieldElement: field.element,
    originalText,
    result,
    onReplace: (suggestion: string) => {
      // Replace text in field
      replaceTextInField(field.element, suggestion);
      
      // Trigger new analysis after replacement
      // Use a small delay to ensure text is updated
      setTimeout(() => {
        const newText = getFieldText(field.element);
        if (newText.trim().length > 0) {
          handleFieldChange(field, newText);
        }
      }, 100);
    },
    onDismiss: () => {
      // User dismissed warning - do nothing, allow normal sending
    }
  });
}

/**
 * Get text content from field
 */
function getFieldText(element: HTMLElement): string {
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
    return element.value;
  } else if (element.isContentEditable) {
    return element.textContent || element.innerText || '';
  }
  return '';
}

/**
 * Initialize content script
 */
function initialize(): void {
  // Register field change handler
  fieldDetector.onFieldChange(handleFieldChange);

  // Initialize field detection
  fieldDetector.initialize();

  // Cleanup on page unload (T093: Clear ephemeral data on navigation)
  window.addEventListener('beforeunload', () => {
    fieldDetector.cleanup();
    uiInjector.cleanup();
  });
  
  // T093: Also cleanup on navigation (SPA support)
  let lastUrl = window.location.href;
  const checkNavigation = () => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      // Clear ephemeral data on navigation
      fieldDetector.cleanup();
      uiInjector.cleanup();
      // Re-initialize for new page
      setTimeout(() => {
        fieldDetector.initialize();
      }, 100);
    }
  };
  
  // Check for navigation periodically (for SPA)
  setInterval(checkNavigation, 500);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

