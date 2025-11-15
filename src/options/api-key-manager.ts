/**
 * API key manager component
 * Handles API key management in options page
 */

import browser from 'webextension-polyfill';
import type { SettingsResponse, SettingsUpdateRequest, ErrorResponse } from '../shared/types';
import { MESSAGE_TYPE_SETTINGS_GET, MESSAGE_TYPE_SETTINGS_UPDATE } from '../shared/constants';

/**
 * Initialize options page
 */
export function initializeOptionsPage(): void {
  const saveButton = document.getElementById('save-button') as HTMLButtonElement;
  const cancelButton = document.getElementById('cancel-button') as HTMLButtonElement;
  const addWebsiteButton = document.getElementById('add-website-button') as HTMLButtonElement;
  const newWebsiteInput = document.getElementById('new-website') as HTMLInputElement;

  // Load settings on initialization
  loadSettings();

  // Handle save button
  saveButton.addEventListener('click', handleSave);

  // Handle cancel button
  cancelButton.addEventListener('click', () => {
    window.location.reload();
  });

  // Handle add website button
  addWebsiteButton.addEventListener('click', () => {
    const domain = newWebsiteInput.value.trim();
    if (domain) {
      addDisabledWebsite(domain);
      newWebsiteInput.value = '';
    }
  });

  // Handle Enter key in new website input
  newWebsiteInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addWebsiteButton.click();
    }
  });
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

    // Populate form fields
    const extensionEnabled = document.getElementById('extension-enabled') as HTMLInputElement;
    const providerSelect = document.getElementById('suggestion-provider') as HTMLSelectElement;
    const thresholdSelect = document.getElementById('sensitivity-threshold') as HTMLSelectElement;

    if (extensionEnabled) {
      extensionEnabled.checked = settings.extensionEnabled ?? true;
    }

    if (providerSelect) {
      providerSelect.value = settings.suggestionProvider || 'gemini';
    }

    if (thresholdSelect) {
      thresholdSelect.value = settings.sensitivityThreshold || 'medium';
    }

    // Load disabled websites
    loadDisabledWebsites(settings.disabledWebsites || []);

    // Initialize API key manager
    initializeApiKeyManager(settings);
  } catch (error) {
    console.error('Error loading settings:', error);
    showError('Failed to load settings');
  }
}

/**
 * Initialize API key manager
 */
function initializeApiKeyManager(settings: SettingsResponse): void {
  const container = document.getElementById('api-key-manager') as HTMLElement;
  if (!container) return;

  container.innerHTML = '';

  // Perspective API key section
  const toneSection = createApiKeySection(
    'Perspective API Key',
    'Required for tone analysis',
    'https://developers.perspectiveapi.com/',
    'tone-analysis-key',
    settings.apiKeyToneAnalysis ? '***configured***' : null,
    () => updateApiKey('tone')
  );
  container.appendChild(toneSection);

  // Suggestion API key section
  const suggestionSection = createApiKeySection(
    'Suggestion API Key',
    `Required for ${settings.suggestionProvider === 'claude' ? 'Claude' : 'Gemini'} suggestions`,
    settings.suggestionProvider === 'claude' 
      ? 'https://console.anthropic.com/'
      : 'https://ai.google.dev/',
    'suggestions-key',
    settings.apiKeySuggestions ? '***configured***' : null,
    () => updateApiKey('suggestions')
  );
  container.appendChild(suggestionSection);
}

/**
 * Create API key section
 */
function createApiKeySection(
  label: string,
  helpText: string,
  linkUrl: string,
  inputId: string,
  currentValue: string | null,
  onUpdate: () => void
): HTMLElement {
  const section = document.createElement('div');
  section.className = 'form-group';

  const labelEl = document.createElement('label');
  labelEl.textContent = label;
  section.appendChild(labelEl);

  const inputContainer = document.createElement('div');
  inputContainer.style.display = 'flex';
  inputContainer.style.gap = '8px';

  const input = document.createElement('input');
  input.type = 'password';
  input.id = inputId;
  input.placeholder = currentValue || 'Enter API key';
  input.style.flex = '1';
  inputContainer.appendChild(input);

  const updateButton = document.createElement('button');
  updateButton.type = 'button';
  updateButton.className = 'secondary';
  updateButton.textContent = currentValue ? 'Update' : 'Set';
  updateButton.addEventListener('click', onUpdate);
  inputContainer.appendChild(updateButton);

  if (currentValue) {
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'danger';
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', () => removeApiKey(inputId));
    inputContainer.appendChild(removeButton);
  }

  section.appendChild(inputContainer);

  const helpEl = document.createElement('div');
  helpEl.className = 'help-text';
  helpEl.innerHTML = `${helpText}. Get your API key from <a href="${linkUrl}" target="_blank">${linkUrl}</a>`;
  section.appendChild(helpEl);

  return section;
}

/**
 * Update API key
 */
async function updateApiKey(type: 'tone' | 'suggestions'): Promise<void> {
  const inputId = type === 'tone' ? 'tone-analysis-key' : 'suggestions-key';
  const input = document.getElementById(inputId) as HTMLInputElement;
  const apiKey = input.value.trim();

  if (!apiKey) {
    showError('Please enter an API key');
    return;
  }

  try {
    const updateRequest: SettingsUpdateRequest = {};
    if (type === 'tone') {
      updateRequest.apiKeyToneAnalysis = apiKey;
    } else {
      updateRequest.apiKeySuggestions = apiKey;
    }

    const response = (await browser.runtime.sendMessage({
      type: MESSAGE_TYPE_SETTINGS_UPDATE,
      payload: updateRequest
    })) as SettingsResponse | ErrorResponse;

    if ('error' in response) {
      showError('Failed to update API key: ' + response.message);
      return;
    }

    showSuccess('API key updated successfully');
    input.value = '';
    
    // Reload settings to update UI
    loadSettings();
  } catch (error) {
    console.error('Error updating API key:', error);
    showError('Failed to update API key');
  }
}

/**
 * Remove API key
 */
async function removeApiKey(inputId: string): Promise<void> {
  const type = inputId === 'tone-analysis-key' ? 'tone' : 'suggestions';
  
  try {
    const updateRequest: SettingsUpdateRequest = {};
    if (type === 'tone') {
      updateRequest.apiKeyToneAnalysis = null;
    } else {
      updateRequest.apiKeySuggestions = null;
    }

    const response = (await browser.runtime.sendMessage({
      type: MESSAGE_TYPE_SETTINGS_UPDATE,
      payload: updateRequest
    })) as SettingsResponse | ErrorResponse;

    if ('error' in response) {
      showError('Failed to remove API key: ' + response.message);
      return;
    }

    showSuccess('API key removed successfully');
    
    // Reload settings to update UI
    loadSettings();
  } catch (error) {
    console.error('Error removing API key:', error);
    showError('Failed to remove API key');
  }
}

/**
 * Load disabled websites list
 */
function loadDisabledWebsites(websites: string[]): void {
  const container = document.getElementById('disabled-websites-list') as HTMLElement;
  if (!container) return;

  container.innerHTML = '';

  websites.forEach((website, index) => {
    const item = document.createElement('div');
    item.className = 'website-item';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = website;
    input.readOnly = true;
    item.appendChild(input);

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'danger';
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', () => removeDisabledWebsite(index));
    item.appendChild(removeButton);

    container.appendChild(item);
  });
}

/**
 * Add disabled website
 */
function addDisabledWebsite(domain: string): void {
  // Basic domain validation
  if (!domain || domain.trim().length === 0) {
    showError('Please enter a valid domain');
    return;
  }

  // Get current list
  const container = document.getElementById('disabled-websites-list') as HTMLElement;
  const currentWebsites: string[] = [];
  container.querySelectorAll('.website-item input').forEach(input => {
    const value = (input as HTMLInputElement).value.trim();
    if (value) {
      currentWebsites.push(value);
    }
  });

  // Check if already exists
  if (currentWebsites.includes(domain)) {
    showError('Website already in list');
    return;
  }

  // Add to list
  currentWebsites.push(domain);
  loadDisabledWebsites(currentWebsites);
}

/**
 * Remove disabled website
 */
function removeDisabledWebsite(index: number): void {
  const container = document.getElementById('disabled-websites-list') as HTMLElement;
  const items = Array.from(container.querySelectorAll('.website-item'));
  if (items[index]) {
    items[index].remove();
  }
}

/**
 * Handle save button click
 */
async function handleSave(): Promise<void> {
  const saveButton = document.getElementById('save-button') as HTMLButtonElement;
  saveButton.disabled = true;
  saveButton.textContent = 'Saving...';

  clearStatus();

  try {
    // Get form values
    const extensionEnabled = (document.getElementById('extension-enabled') as HTMLInputElement).checked;
    const provider = (document.getElementById('suggestion-provider') as HTMLSelectElement).value;
    const threshold = (document.getElementById('sensitivity-threshold') as HTMLSelectElement).value;

    // Get disabled websites
    const container = document.getElementById('disabled-websites-list') as HTMLElement;
    const disabledWebsites: string[] = [];
    container.querySelectorAll('.website-item input').forEach(input => {
      const value = (input as HTMLInputElement).value.trim();
      if (value) {
        disabledWebsites.push(value);
      }
    });

    // Build update request
    const updateRequest: SettingsUpdateRequest = {
      extensionEnabled,
      suggestionProvider: provider as 'claude' | 'gemini',
      sensitivityThreshold: threshold as 'low' | 'medium' | 'high',
      disabledWebsites
    };

    // Send update request
    const response = (await browser.runtime.sendMessage({
      type: MESSAGE_TYPE_SETTINGS_UPDATE,
      payload: updateRequest
    })) as SettingsResponse | ErrorResponse;

    if ('error' in response) {
      showError('Failed to save settings: ' + response.message);
      saveButton.disabled = false;
      saveButton.textContent = 'Save Settings';
      return;
    }

    // Success
    showSuccess('Settings saved successfully!');
    saveButton.disabled = false;
    saveButton.textContent = 'Save Settings';
  } catch (error) {
    console.error('Error saving settings:', error);
    showError('Failed to save settings: ' + (error instanceof Error ? error.message : 'Unknown error'));
    saveButton.disabled = false;
    saveButton.textContent = 'Save Settings';
  }
}

/**
 * Show error message
 */
function showError(message: string): void {
  const status = document.getElementById('save-status') as HTMLElement;
  if (status) {
    status.className = 'error';
    status.textContent = message;
    status.style.display = 'block';
  }
}

/**
 * Show success message
 */
function showSuccess(message: string): void {
  const status = document.getElementById('save-status') as HTMLElement;
  if (status) {
    status.className = 'success';
    status.textContent = message;
    status.style.display = 'block';
  }
}

/**
 * Clear status messages
 */
function clearStatus(): void {
  const status = document.getElementById('save-status') as HTMLElement;
  if (status) {
    status.textContent = '';
    status.style.display = 'none';
  }
}

