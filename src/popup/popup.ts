/**
 * Popup entry point
 * Initializes the popup UI and handles user interactions
 */

import { initializeSettingsForm } from './settings-form';

// Initialize popup when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSettingsForm);
} else {
  initializeSettingsForm();
}

