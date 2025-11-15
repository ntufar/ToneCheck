/**
 * Settings form component
 * Handles loading, saving, and validation of extension settings
 */

import browser from 'webextension-polyfill';
import type { SettingsResponse, SettingsUpdateRequest, ErrorResponse } from '../shared/types';
import { MESSAGE_TYPE_SETTINGS_GET, MESSAGE_TYPE_SETTINGS_UPDATE } from '../shared/constants';

/**
 * Initialize settings form
 */
export function initializeSettingsForm(): void {
  const form = document.getElementById('settings-form') as HTMLFormElement;
  const cancelButton = document.getElementById('cancel-button') as HTMLButtonElement;
  const privacyNotice = document.getElementById('privacy-notice') as HTMLElement;

  // Load settings on initialization
  loadSettings();

  // Handle form submission
  form.addEventListener('submit', handleFormSubmit);

  // Handle cancel button
  cancelButton.addEventListener('click', () => {
    window.close();
  });

  // Show privacy notice on first-time setup
  checkFirstTimeSetup(privacyNotice);
}

/**
 * Load settings from background worker
 */
async function loadSettings(): Promise<void> {
  try {
    const response = (await browser.runtime.sendMessage({
      type: MESSAGE_TYPE_SETTINGS_GET
    })) as SettingsResponse | ErrorResponse;

    if ('error' in response) {
      showError('Failed to load settings: ' + response.message);
      return;
    }

    const settings = response;

    // Populate form fields (API keys are encrypted, so we don't show them)
    // Users need to re-enter API keys if they want to update them
    const providerSelect = document.getElementById('suggestion-provider') as HTMLSelectElement;
    const thresholdSelect = document.getElementById('sensitivity-threshold') as HTMLSelectElement;

    if (providerSelect) {
      providerSelect.value = settings.suggestionProvider || 'gemini';
    }

    if (thresholdSelect) {
      thresholdSelect.value = settings.sensitivityThreshold || 'medium';
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    showError('Failed to load settings');
  }
}

/**
 * Handle form submission
 */
async function handleFormSubmit(event: Event): Promise<void> {
  event.preventDefault();

  const form = event.target as HTMLFormElement;
  const saveButton = document.getElementById('save-button') as HTMLButtonElement;
  const saveStatus = document.getElementById('save-status') as HTMLElement;

  // Clear previous errors
  clearErrors();
  clearStatus();

  // Disable save button
  saveButton.disabled = true;
  saveButton.textContent = 'Saving...';

  try {
    // Get form values
    const toneApiKey = (document.getElementById('api-key-tone') as HTMLInputElement).value.trim();
    const suggestionsApiKey = (document.getElementById('api-key-suggestions') as HTMLInputElement).value.trim();
    const provider = (document.getElementById('suggestion-provider') as HTMLSelectElement).value;
    const threshold = (document.getElementById('sensitivity-threshold') as HTMLSelectElement).value;

    // Validate
    const validationError = validateForm(toneApiKey, suggestionsApiKey, provider, threshold);
    if (validationError) {
      showError(validationError);
      saveButton.disabled = false;
      saveButton.textContent = 'Save Settings';
      return;
    }

    // Build update request
    const updateRequest: SettingsUpdateRequest = {
      suggestionProvider: provider as 'claude' | 'gemini',
      sensitivityThreshold: threshold as 'low' | 'medium' | 'high'
    };

    // Only include API keys if provided (non-empty)
    if (toneApiKey) {
      updateRequest.apiKeyToneAnalysis = toneApiKey;
    }

    if (suggestionsApiKey) {
      updateRequest.apiKeySuggestions = suggestionsApiKey;
    }

    // Send update request
    console.log('Sending settings update request:', { ...updateRequest, apiKeyToneAnalysis: updateRequest.apiKeyToneAnalysis ? '***' : undefined, apiKeySuggestions: updateRequest.apiKeySuggestions ? '***' : undefined });
    
    const response = (await browser.runtime.sendMessage({
      type: MESSAGE_TYPE_SETTINGS_UPDATE,
      payload: updateRequest
    })) as SettingsResponse | ErrorResponse;

    console.log('Settings update response:', response);

    if ('error' in response) {
      console.error('Settings update error:', response);
      showError('Failed to save settings: ' + response.message);
      saveButton.disabled = false;
      saveButton.textContent = 'Save Settings';
      return;
    }

    // Success
    showSuccess('Settings saved successfully!');
    
    // Clear API key fields for security
    (document.getElementById('api-key-tone') as HTMLInputElement).value = '';
    (document.getElementById('api-key-suggestions') as HTMLInputElement).value = '';

    // Close popup after a short delay
    setTimeout(() => {
      window.close();
    }, 1000);
  } catch (error) {
    console.error('Error saving settings:', error);
    showError('Failed to save settings: ' + (error instanceof Error ? error.message : 'Unknown error'));
    saveButton.disabled = false;
    saveButton.textContent = 'Save Settings';
  }
}

/**
 * Validate form inputs
 */
function validateForm(
  toneApiKey: string,
  suggestionsApiKey: string,
  provider: string,
  threshold: string
): string | null {
  // At least one API key should be provided (tone analysis is required)
  if (!toneApiKey && !suggestionsApiKey) {
    return 'Please provide at least one API key (Perspective API key is required for tone analysis)';
  }

  // If suggestions API key is provided, provider must be valid
  if (suggestionsApiKey && provider !== 'claude' && provider !== 'gemini') {
    return 'Invalid suggestion provider';
  }

  // Threshold must be valid
  if (threshold !== 'low' && threshold !== 'medium' && threshold !== 'high') {
    return 'Invalid sensitivity threshold';
  }

  return null;
}

/**
 * Show error message
 */
function showError(message: string): void {
  const saveStatus = document.getElementById('save-status') as HTMLElement;
  if (saveStatus) {
    saveStatus.className = 'error';
    saveStatus.textContent = message;
    saveStatus.style.display = 'block';
  }
}

/**
 * Show success message
 */
function showSuccess(message: string): void {
  const saveStatus = document.getElementById('save-status') as HTMLElement;
  if (saveStatus) {
    saveStatus.className = 'success';
    saveStatus.textContent = message;
    saveStatus.style.display = 'block';
  }
}

/**
 * Clear error messages
 */
function clearErrors(): void {
  const errorElements = document.querySelectorAll('.error');
  errorElements.forEach(el => {
    (el as HTMLElement).style.display = 'none';
    (el as HTMLElement).textContent = '';
  });
}

/**
 * Clear status messages
 */
function clearStatus(): void {
  const saveStatus = document.getElementById('save-status') as HTMLElement;
  if (saveStatus) {
    saveStatus.textContent = '';
    saveStatus.style.display = 'none';
  }
}

/**
 * Check if this is first-time setup and show privacy notice
 */
async function checkFirstTimeSetup(privacyNotice: HTMLElement): Promise<void> {
  try {
    const response = (await browser.runtime.sendMessage({
      type: MESSAGE_TYPE_SETTINGS_GET
    })) as SettingsResponse | ErrorResponse;

    if ('error' in response) {
      // If settings don't exist, show privacy notice
      privacyNotice.style.display = 'block';
      return;
    }

    const settings = response;
    
    // If no API keys are configured, show privacy notice
    if (!settings.apiKeyToneAnalysis && !settings.apiKeySuggestions) {
      privacyNotice.style.display = 'block';
    }
  } catch (error) {
    // On error, show privacy notice
    privacyNotice.style.display = 'block';
  }
}

