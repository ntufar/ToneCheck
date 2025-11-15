/**
 * Tone indicator component
 * Displays color-coded indicators (green/yellow/red) with tone scores
 * Includes review interface for flagged messages with suggestions
 */

import type { ToneAnalysisResult } from '../shared/types';
import { 
  INDICATOR_COLORS, 
  INDICATOR_THRESHOLDS,
  RATE_LIMIT_QUEUE_WARNING_THRESHOLD,
  MESSAGE_TYPE_SUGGESTIONS,
  MESSAGE_TYPE_ANALYZE
} from '../shared/constants';
import browser from 'webextension-polyfill';

/**
 * Create a tone indicator element
 */
export function createToneIndicator(result: ToneAnalysisResult): HTMLElement {
  const indicator = document.createElement('div');
  indicator.className = 'tonecheck-indicator';
  indicator.setAttribute('role', 'status');
  indicator.setAttribute('aria-live', 'polite');
  
  updateToneIndicator(indicator, result);
  
  return indicator;
}

/**
 * Update tone indicator with new result
 */
export function updateToneIndicator(
  indicator: HTMLElement, 
  result: ToneAnalysisResult
): void {
  const aggression = result.overallAggression / 100; // Convert to 0-1 scale
  
  // Determine color based on aggression level
  let color: string;
  let status: string;
  
  if (aggression < INDICATOR_THRESHOLDS.safe) {
    color = INDICATOR_COLORS.safe;
    status = 'Safe';
  } else if (aggression < INDICATOR_THRESHOLDS.warning) {
    color = INDICATOR_COLORS.warning;
    status = 'Warning';
  } else {
    color = INDICATOR_COLORS.danger;
    status = 'Danger';
  }

  // Set indicator style
  indicator.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: 4px;
    background-color: ${color}20;
    border: 1px solid ${color};
    color: ${color};
    font-size: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-weight: 500;
    pointer-events: none;
    user-select: none;
    transition: opacity 0.2s ease-in;
    opacity: 0;
  `;

  // Create content
  const icon = document.createElement('span');
  icon.textContent = getStatusIcon(status);
  icon.setAttribute('aria-hidden', 'true');

  const text = document.createElement('span');
  text.textContent = `${status} (${Math.round(result.overallAggression)}%)`;
  text.setAttribute('aria-label', `Tone analysis: ${status}, ${Math.round(result.overallAggression)}% aggression`);

  indicator.innerHTML = '';
  indicator.appendChild(icon);
  indicator.appendChild(text);

  // Fade in animation
  requestAnimationFrame(() => {
    indicator.style.opacity = '1';
  });

  // Show detailed breakdown if flagged
  if (aggression >= INDICATOR_THRESHOLDS.warning) {
    showDetailedBreakdown(indicator, result);
  }

  // Check for rate limit warning (query background worker)
  checkRateLimitWarning(indicator);
}

/**
 * Show detailed breakdown for flagged messages
 */
function showDetailedBreakdown(indicator: HTMLElement, result: ToneAnalysisResult): void {
  const breakdown = document.createElement('div');
  breakdown.className = 'tonecheck-breakdown';
  breakdown.style.cssText = `
    margin-top: 4px;
    font-size: 11px;
    opacity: 0.9;
  `;

  const scores = [
    { label: 'Toxicity', value: result.toxicity },
    { label: 'Insult', value: result.insult },
    { label: 'Threat', value: result.threat },
    { label: 'Profanity', value: result.profanity }
  ].filter(score => score.value > 0.3); // Only show significant scores

  if (scores.length > 0) {
    const breakdownText = scores
      .map(score => `${score.label}: ${Math.round(score.value * 100)}%`)
      .join(', ');
    breakdown.textContent = breakdownText;
    indicator.appendChild(breakdown);
  }
}

/**
 * Check and show rate limit warning
 */
async function checkRateLimitWarning(indicator: HTMLElement): Promise<void> {
  // Note: Rate limit checking would require exposing queue length via message
  // For MVP, we'll skip this check or implement a simpler approach
  // This can be enhanced in Phase 6
}

/**
 * Get status icon
 */
function getStatusIcon(status: string): string {
  switch (status) {
    case 'Safe':
      return '✓';
    case 'Warning':
      return '⚠';
    case 'Danger':
      return '⚠';
    default:
      return '•';
  }
}

/**
 * Show loading indicator
 */
export function showLoadingIndicator(fieldId: string): HTMLElement {
  const indicator = document.createElement('div');
  indicator.className = 'tonecheck-indicator tonecheck-loading';
  indicator.setAttribute('data-field-id', fieldId);
  indicator.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: 4px;
    background-color: #f3f4f6;
    border: 1px solid #d1d5db;
    color: #6b7280;
    font-size: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  const spinner = document.createElement('span');
  spinner.textContent = '⏳';
  spinner.setAttribute('aria-hidden', 'true');

  const text = document.createElement('span');
  text.textContent = 'Analyzing...';
  text.setAttribute('aria-label', 'Analyzing tone');

  indicator.appendChild(spinner);
  indicator.appendChild(text);

  return indicator;
}

/**
 * Show error indicator
 */
export function showErrorIndicator(fieldId: string, message: string): HTMLElement {
  const indicator = document.createElement('div');
  indicator.className = 'tonecheck-indicator tonecheck-error';
  indicator.setAttribute('data-field-id', fieldId);
  indicator.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: 4px;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    font-size: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  const icon = document.createElement('span');
  icon.textContent = '⚠';
  icon.setAttribute('aria-hidden', 'true');

  const text = document.createElement('span');
  text.textContent = message;
  text.setAttribute('aria-label', `Error: ${message}`);

  indicator.appendChild(icon);
  indicator.appendChild(text);

  return indicator;
}

/**
 * Remove tone indicator
 */
export function removeToneIndicator(indicator: HTMLElement): void {
  if (indicator.parentNode) {
    indicator.parentNode.removeChild(indicator);
  }
}

// ============================================================================
// Review Interface (Phase 4 - US2)
// ============================================================================

interface ReviewInterfaceOptions {
  fieldId: string;
  fieldElement: HTMLElement;
  originalText: string;
  result: ToneAnalysisResult;
  onReplace: (suggestion: string) => void;
  onDismiss: () => void;
}

/**
 * Create review interface component (modal/panel)
 * Shows when message is flagged with suggestions
 */
export function createReviewInterface(options: ReviewInterfaceOptions): HTMLElement {
  const { fieldId, fieldElement, originalText, result, onReplace, onDismiss } = options;

  const reviewPanel = document.createElement('div');
  reviewPanel.className = 'tonecheck-review-panel';
  reviewPanel.setAttribute('data-field-id', fieldId);
  reviewPanel.setAttribute('role', 'dialog');
  reviewPanel.setAttribute('aria-labelledby', 'tonecheck-review-title');
  reviewPanel.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border: 2px solid ${INDICATOR_COLORS.danger};
    border-radius: 8px;
    padding: 16px;
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10001;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
  `;

  // Title
  const title = document.createElement('h3');
  title.id = 'tonecheck-review-title';
  title.textContent = 'Review Message';
  title.style.cssText = `
    margin: 0 0 12px 0;
    font-size: 18px;
    font-weight: 600;
    color: ${INDICATOR_COLORS.danger};
  `;
  reviewPanel.appendChild(title);

  // Warning message
  const warning = document.createElement('p');
  warning.textContent = 'This message may be perceived as aggressive. Consider using one of the suggestions below.';
  warning.style.cssText = `
    margin: 0 0 12px 0;
    color: #6b7280;
    font-size: 13px;
  `;
  reviewPanel.appendChild(warning);

  // Original text with highlighting
  const originalSection = document.createElement('div');
  originalSection.style.cssText = 'margin-bottom: 16px;';
  
  const originalLabel = document.createElement('div');
  originalLabel.textContent = 'Original text:';
  originalLabel.style.cssText = 'font-weight: 500; margin-bottom: 8px; color: #374151;';
  originalSection.appendChild(originalLabel);

  const originalTextDiv = document.createElement('div');
  originalTextDiv.innerHTML = highlightProblematicPhrases(originalText, result);
  originalTextDiv.style.cssText = `
    padding: 8px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    color: #111827;
    line-height: 1.5;
  `;
  originalSection.appendChild(originalTextDiv);
  reviewPanel.appendChild(originalSection);

  // Suggestions section (will be populated after API call)
  const suggestionsSection = document.createElement('div');
  suggestionsSection.id = 'tonecheck-suggestions';
  suggestionsSection.style.cssText = 'margin-bottom: 16px;';
  
  const suggestionsLabel = document.createElement('div');
  suggestionsLabel.textContent = 'Suggestions:';
  suggestionsLabel.style.cssText = 'font-weight: 500; margin-bottom: 8px; color: #374151;';
  suggestionsSection.appendChild(suggestionsLabel);

  const loadingDiv = document.createElement('div');
  loadingDiv.textContent = 'Generating suggestions...';
  loadingDiv.style.cssText = 'color: #6b7280; font-style: italic;';
  suggestionsSection.appendChild(loadingDiv);
  reviewPanel.appendChild(suggestionsSection);

  // Buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  `;

  const dismissButton = document.createElement('button');
  dismissButton.textContent = 'Send Anyway';
  dismissButton.style.cssText = `
    padding: 8px 16px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    background: white;
    color: #374151;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
  `;
  dismissButton.addEventListener('click', () => {
    onDismiss();
    removeReviewInterface(reviewPanel);
  });
  dismissButton.addEventListener('mouseenter', () => {
    dismissButton.style.background = '#f9fafb';
  });
  dismissButton.addEventListener('mouseleave', () => {
    dismissButton.style.background = 'white';
  });
  buttonContainer.appendChild(dismissButton);
  reviewPanel.appendChild(buttonContainer);

  // Load suggestions asynchronously
  loadSuggestions(originalText, result, suggestionsSection, onReplace, reviewPanel);

  // Append to body
  document.body.appendChild(reviewPanel);

  // Add backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'tonecheck-review-backdrop';
  backdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 10000;
  `;
  backdrop.addEventListener('click', () => {
    onDismiss();
    removeReviewInterface(reviewPanel);
  });
  document.body.appendChild(backdrop);

  return reviewPanel;
}

/**
 * Highlight problematic phrases in original text
 * Uses simple word-based highlighting for MVP
 */
function highlightProblematicPhrases(text: string, result: ToneAnalysisResult): string {
  // Simple approach: highlight words that might be problematic
  // In a more sophisticated implementation, we could use NLP to identify specific phrases
  // For MVP, we'll highlight the entire text if it's flagged
  const aggression = result.overallAggression / 100;
  
  if (aggression >= INDICATOR_THRESHOLDS.warning) {
    // Escape HTML and wrap in highlight span
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    return `<span style="background-color: ${INDICATOR_COLORS.danger}20; padding: 2px 4px; border-radius: 2px;">${escaped}</span>`;
  }
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Load suggestions from background worker
 */
async function loadSuggestions(
  originalText: string,
  result: ToneAnalysisResult,
  container: HTMLElement,
  onReplace: (suggestion: string) => void,
  reviewPanel: HTMLElement
): Promise<void> {
  try {
    // Determine flagged attributes
    const flaggedAttributes: ('toxicity' | 'insult' | 'threat' | 'profanity')[] = [];
    if (result.toxicity > 0.3) flaggedAttributes.push('toxicity');
    if (result.insult > 0.3) flaggedAttributes.push('insult');
    if (result.threat > 0.3) flaggedAttributes.push('threat');
    if (result.profanity > 0.3) flaggedAttributes.push('profanity');

    // Request suggestions from background worker
    const response = (await browser.runtime.sendMessage({
      type: MESSAGE_TYPE_SUGGESTIONS,
      payload: {
        text: originalText,
        flaggedAttributes,
        requestId: result.requestId,
        aggressionScore: result.overallAggression
      }
    })) as import('../shared/types').SuggestionResponse | import('../shared/types').ErrorResponse;

    // Clear loading message
    container.innerHTML = '';
    const suggestionsLabel = document.createElement('div');
    suggestionsLabel.textContent = 'Suggestions:';
    suggestionsLabel.style.cssText = 'font-weight: 500; margin-bottom: 8px; color: #374151;';
    container.appendChild(suggestionsLabel);

    // Check for errors
    if ('error' in response) {
      const errorDiv = document.createElement('div');
      errorDiv.textContent = `Error: ${response.message}`;
      errorDiv.style.cssText = 'color: #dc2626; padding: 8px; background: #fef2f2; border-radius: 4px;';
      container.appendChild(errorDiv);
      return;
    }

    // Display suggestions
    if (response.suggestions && response.suggestions.length > 0) {
      response.suggestions.forEach((suggestion: string, index: number) => {
        const suggestionDiv = document.createElement('div');
        suggestionDiv.style.cssText = `
          margin-bottom: 8px;
          padding: 12px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s;
        `;
        suggestionDiv.textContent = suggestion;
        suggestionDiv.setAttribute('role', 'button');
        suggestionDiv.setAttribute('tabindex', '0');
        suggestionDiv.setAttribute('aria-label', `Suggestion ${index + 1}: ${suggestion}`);

        suggestionDiv.addEventListener('click', () => {
          onReplace(suggestion);
          removeReviewInterface(reviewPanel);
        });
        suggestionDiv.addEventListener('mouseenter', () => {
          suggestionDiv.style.background = '#f3f4f6';
        });
        suggestionDiv.addEventListener('mouseleave', () => {
          suggestionDiv.style.background = '#f9fafb';
        });
        suggestionDiv.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onReplace(suggestion);
            removeReviewInterface(reviewPanel);
          }
        });

        container.appendChild(suggestionDiv);
      });
    } else {
      const noSuggestionsDiv = document.createElement('div');
      noSuggestionsDiv.textContent = 'No suggestions available.';
      noSuggestionsDiv.style.cssText = 'color: #6b7280; font-style: italic;';
      container.appendChild(noSuggestionsDiv);
    }
  } catch (error) {
    // Clear loading and show error
    container.innerHTML = '';
    const errorDiv = document.createElement('div');
    errorDiv.textContent = `Error loading suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`;
    errorDiv.style.cssText = 'color: #dc2626; padding: 8px; background: #fef2f2; border-radius: 4px;';
    container.appendChild(errorDiv);
  }
}

/**
 * Remove review interface
 */
export function removeReviewInterface(reviewPanel: HTMLElement): void {
  // Remove backdrop
  const backdrop = document.querySelector('.tonecheck-review-backdrop');
  if (backdrop && backdrop.parentNode) {
    backdrop.parentNode.removeChild(backdrop);
  }

  // Remove panel
  if (reviewPanel.parentNode) {
    reviewPanel.parentNode.removeChild(reviewPanel);
  }
}

/**
 * Replace text in field with suggestion
 */
export function replaceTextInField(fieldElement: HTMLElement, newText: string): void {
  if (fieldElement instanceof HTMLTextAreaElement || fieldElement instanceof HTMLInputElement) {
    fieldElement.value = newText;
    // Trigger input event to notify any listeners
    fieldElement.dispatchEvent(new Event('input', { bubbles: true }));
  } else if (fieldElement.isContentEditable) {
    fieldElement.textContent = newText;
    // Trigger input event
    fieldElement.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

