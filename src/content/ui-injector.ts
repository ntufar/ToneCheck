/**
 * UI injector for tone indicators
 * Creates and positions tone indicator elements near text fields
 */

import type { DetectedField } from './field-detector';
import type { ToneAnalysisResult } from '../shared/types';
import { createToneIndicator, updateToneIndicator } from './tone-indicator';

class UIInjector {
  private indicators: Map<string, HTMLElement> = new Map();

  /**
   * Inject tone indicator for a field
   */
  injectIndicator(field: DetectedField, result: ToneAnalysisResult): void {
    // Remove existing indicator if present
    this.removeIndicator(field.fieldId);

    // Create new indicator
    const indicator = createToneIndicator(result);
    
    // Position indicator near field
    this.positionIndicator(indicator, field.element);
    
    // Store reference
    this.indicators.set(field.fieldId, indicator);
  }

  /**
   * Update existing indicator
   */
  updateIndicator(field: DetectedField, result: ToneAnalysisResult): void {
    const indicator = this.indicators.get(field.fieldId);
    if (indicator) {
      updateToneIndicator(indicator, result);
    } else {
      // Create if doesn't exist
      this.injectIndicator(field, result);
    }
  }

  /**
   * Remove indicator for a field
   */
  removeIndicator(fieldId: string): void {
    const indicator = this.indicators.get(fieldId);
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
      this.indicators.delete(fieldId);
    }
  }

  /**
   * Position indicator near text field (non-intrusive placement)
   */
  private positionIndicator(indicator: HTMLElement, fieldElement: HTMLElement): void {
    const fieldRect = fieldElement.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    // Position indicator to the right of the field, aligned with top
    indicator.style.position = 'absolute';
    indicator.style.left = `${fieldRect.right + scrollX + 10}px`;
    indicator.style.top = `${fieldRect.top + scrollY}px`;
    indicator.style.zIndex = '10000';

    // Append to body (or nearest positioned ancestor)
    document.body.appendChild(indicator);
  }

  /**
   * Cleanup all indicators
   */
  cleanup(): void {
    this.indicators.forEach((indicator, fieldId) => {
      this.removeIndicator(fieldId);
    });
  }
}

// Singleton instance
export const uiInjector = new UIInjector();

