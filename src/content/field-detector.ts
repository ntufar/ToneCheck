/**
 * Field detector for identifying text input fields
 * Supports major platforms (Gmail, Reddit, Twitter/X, LinkedIn, Facebook) and generic detection
 */

import { 
  PLATFORM_SELECTORS, 
  GENERIC_SELECTORS, 
  EXCLUDED_INPUT_TYPES,
  DEBOUNCE_DELAY_MS 
} from '../shared/constants';

export interface DetectedField {
  element: HTMLElement;
  fieldId: string;
  platform?: string;
}

type DebounceTimer = ReturnType<typeof setTimeout>;
type FieldChangeCallback = (field: DetectedField, text: string) => void;

class FieldDetector {
  private detectedFields: Map<string, DetectedField> = new Map();
  private debounceTimers: Map<string, DebounceTimer> = new Map();
  private onChangeCallbacks: FieldChangeCallback[] = [];
  private observer: MutationObserver | null = null;

  /**
   * Initialize field detection
   */
  initialize(): void {
    // Detect fields on page load
    this.detectFields();

    // Watch for dynamically added fields (SPA support)
    this.observeDynamicFields();

    // Listen for input events
    document.addEventListener('input', this.handleInput.bind(this), true);
  }

  /**
   * Register callback for field text changes
   */
  onFieldChange(callback: FieldChangeCallback): void {
    this.onChangeCallbacks.push(callback);
  }

  /**
   * Detect text fields on the page
   */
  private detectFields(): void {
    // Detect platform-specific fields
    const platform = this.detectPlatform();
    if (platform) {
      this.detectPlatformFields(platform);
    }

    // Detect generic fields
    this.detectGenericFields();
    
    // T086: Attempt to detect iframe fields (same-origin only)
    this.detectIframeFields();
  }

  /**
   * Detect which platform we're on
   */
  private detectPlatform(): keyof typeof PLATFORM_SELECTORS | null {
    const hostname = window.location.hostname.toLowerCase();

    if (hostname.includes('gmail.com') || hostname.includes('mail.google.com')) {
      return 'gmail';
    } else if (hostname.includes('reddit.com')) {
      return 'reddit';
    } else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return 'twitter';
    } else if (hostname.includes('linkedin.com')) {
      return 'linkedin';
    } else if (hostname.includes('facebook.com')) {
      return 'facebook';
    }

    return null;
  }

  /**
   * Detect platform-specific fields
   */
  private detectPlatformFields(platform: keyof typeof PLATFORM_SELECTORS): void {
    const selectors = PLATFORM_SELECTORS[platform];
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll<HTMLElement>(selector);
      elements.forEach(element => {
        if (this.isValidField(element)) {
          this.registerField(element, platform);
        }
      });
    }
  }

  /**
   * Detect generic text fields
   */
  private detectGenericFields(): void {
    for (const selector of GENERIC_SELECTORS) {
      const elements = document.querySelectorAll<HTMLElement>(selector);
      elements.forEach(element => {
        if (this.isValidField(element)) {
          this.registerField(element);
        }
      });
    }
  }

  /**
   * Check if element is a valid text field
   * T087: Skip password fields and sensitive input types
   */
  private isValidField(element: HTMLElement): boolean {
    // Skip if already detected
    if (element.dataset.tonecheckDetected === 'true') {
      return false;
    }

    // Skip password fields and sensitive input types
    if (element instanceof HTMLInputElement) {
      if (EXCLUDED_INPUT_TYPES.includes(element.type)) {
        return false;
      }
      
      // T087: Skip password fields explicitly (already in EXCLUDED_INPUT_TYPES, but be explicit)
      if (element.type === 'password' || element.autocomplete === 'current-password' || element.autocomplete === 'new-password') {
        return false;
      }
    }

    // Skip if element is hidden or disabled
    if (element.hasAttribute('disabled') || element.hasAttribute('hidden')) {
      return false;
    }

    // Skip if element is not visible
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }

    return true;
  }

  /**
   * Register a detected field
   */
  private registerField(element: HTMLElement, platform?: string): void {
    const fieldId = this.generateFieldId(element);
    
    element.dataset.tonecheckDetected = 'true';
    element.dataset.tonecheckFieldId = fieldId;

    const field: DetectedField = {
      element,
      fieldId,
      platform
    };

    this.detectedFields.set(fieldId, field);
  }

  /**
   * Generate unique field ID
   */
  private generateFieldId(element: HTMLElement): string {
    // Try to use existing ID
    if (element.id) {
      return `field-${element.id}`;
    }

    // Try to use name attribute
    if (element instanceof HTMLInputElement && element.name) {
      return `field-${element.name}`;
    }

    // Generate UUID-based ID
    return `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Handle input events with debouncing
   */
  private handleInput(event: Event): void {
    const target = event.target as HTMLElement;
    
    if (!target || target.dataset.tonecheckDetected !== 'true') {
      return;
    }

    const fieldId = target.dataset.tonecheckFieldId;
    if (!fieldId) {
      return;
    }

    const field = this.detectedFields.get(fieldId);
    if (!field) {
      return;
    }

    // Clear existing timer
    const existingTimer = this.debounceTimers.get(fieldId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Get text content
    const text = this.getFieldText(field.element);

    // Set new debounce timer
    const timer = setTimeout(() => {
      this.debounceTimers.delete(fieldId);
      this.notifyFieldChange(field, text);
    }, DEBOUNCE_DELAY_MS);

    this.debounceTimers.set(fieldId, timer);
  }

  /**
   * Get text content from field
   */
  private getFieldText(element: HTMLElement): string {
    if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
      return element.value;
    } else if (element.isContentEditable) {
      return element.textContent || element.innerText || '';
    }
    return '';
  }

  /**
   * Notify callbacks of field change
   */
  private notifyFieldChange(field: DetectedField, text: string): void {
    if (text.trim().length === 0) {
      return; // Skip empty text
    }

    this.onChangeCallbacks.forEach(callback => {
      try {
        callback(field, text);
      } catch (error) {
        console.error('Error in field change callback:', error);
      }
    });
  }

  /**
   * Observe dynamically added fields (SPA support)
   * T085: Handle dynamically loaded content (SPA text field injection)
   */
  private observeDynamicFields(): void {
    // Use throttled detection to avoid excessive DOM queries
    let throttleTimer: ReturnType<typeof setTimeout> | null = null;
    
    this.observer = new MutationObserver(() => {
      // Throttle detection to avoid excessive DOM queries (T091)
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
      
      throttleTimer = setTimeout(() => {
        this.detectFields();
        throttleTimer = null;
      }, 100); // 100ms throttle
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  /**
   * T086: Handle iframe text fields (cross-origin detection)
   * Note: Cross-origin iframes are limited by browser security
   * This method attempts to detect same-origin iframes
   */
  private detectIframeFields(): void {
    try {
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        try {
          // Only process same-origin iframes (cross-origin will throw)
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            // Detect fields in iframe
            for (const selector of GENERIC_SELECTORS) {
              const elements = iframeDoc.querySelectorAll<HTMLElement>(selector);
              elements.forEach(element => {
                if (this.isValidField(element)) {
                  // Generate unique field ID for iframe fields
                  const fieldId = `iframe-${iframe.id || Date.now()}-${this.generateFieldId(element)}`;
                  element.dataset.tonecheckDetected = 'true';
                  element.dataset.tonecheckFieldId = fieldId;
                  
                  // Register field with iframe context
                  this.detectedFields.set(fieldId, {
                    element,
                    fieldId,
                    platform: 'iframe'
                  });
                }
              });
            }
          }
        } catch (e) {
          // Cross-origin iframe - skip silently
          // Browser security prevents access to cross-origin iframe content
        }
      });
    } catch (error) {
      // Silently fail iframe detection (security restrictions)
      console.debug('Iframe field detection skipped:', error);
    }
  }

  /**
   * Cleanup
   * T093: Clear ephemeral data on page navigation
   */
  cleanup(): void {
    // Clear all timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();

    // Disconnect observer
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // Clear callbacks
    this.onChangeCallbacks = [];
    
    // T093: Clear detected fields map (ephemeral data)
    this.detectedFields.clear();
    
    // Remove all detection markers
    document.querySelectorAll('[data-tonecheck-detected]').forEach(el => {
      delete (el as HTMLElement).dataset.tonecheckDetected;
      delete (el as HTMLElement).dataset.tonecheckFieldId;
    });
  }

  /**
   * Get all detected fields
   */
  getDetectedFields(): DetectedField[] {
    return Array.from(this.detectedFields.values());
  }
}

// Singleton instance
export const fieldDetector = new FieldDetector();

