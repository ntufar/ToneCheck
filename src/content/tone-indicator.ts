/**
 * Tone indicator component
 * Displays color-coded indicators (green/yellow/red) with tone scores
 */

import type { ToneAnalysisResult } from '../shared/types';
import { 
  INDICATOR_COLORS, 
  INDICATOR_THRESHOLDS,
  RATE_LIMIT_QUEUE_WARNING_THRESHOLD 
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

