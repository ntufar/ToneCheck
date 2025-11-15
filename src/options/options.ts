/**
 * Options page entry point
 * Initializes the options page UI and handles user interactions
 */

import { initializeOptionsPage } from './api-key-manager';

// Initialize options page when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeOptionsPage);
} else {
  initializeOptionsPage();
}

