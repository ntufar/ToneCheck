/**
 * Storage layer for UserSettings
 * Handles reading/writing to browser.storage.local
 */

import browser from 'webextension-polyfill';
import type { UserSettings } from '../shared/types';
import { STORAGE_KEY_USER_SETTINGS, DEFAULT_SETTINGS } from '../shared/constants';
import { encrypt, decrypt } from '../shared/encryption';

/**
 * Get user settings from storage
 * @returns UserSettings object or null if not found
 */
export async function getSettings(): Promise<UserSettings | null> {
  try {
    const result = await browser.storage.local.get(STORAGE_KEY_USER_SETTINGS);
    const settings = result[STORAGE_KEY_USER_SETTINGS] as UserSettings | undefined;
    
    if (!settings) {
      return null;
    }
    
    return settings;
  } catch (error) {
    console.error('Error reading settings from storage:', error);
    return null;
  }
}

/**
 * Get user settings with defaults applied
 * @returns UserSettings object with defaults for missing values
 */
export async function getSettingsWithDefaults(): Promise<UserSettings> {
  const settings = await getSettings();
  
  if (!settings) {
    return {
      ...DEFAULT_SETTINGS,
      lastUpdated: Date.now()
    };
  }
  
  // Merge with defaults to ensure all required fields are present
  return {
    suggestionProvider: settings.suggestionProvider || DEFAULT_SETTINGS.suggestionProvider,
    sensitivityThreshold: settings.sensitivityThreshold || DEFAULT_SETTINGS.sensitivityThreshold,
    disabledWebsites: settings.disabledWebsites || DEFAULT_SETTINGS.disabledWebsites,
    extensionEnabled: settings.extensionEnabled ?? DEFAULT_SETTINGS.extensionEnabled,
    apiKeyToneAnalysis: settings.apiKeyToneAnalysis,
    apiKeySuggestions: settings.apiKeySuggestions,
    lastUpdated: settings.lastUpdated || Date.now()
  };
}

/**
 * Save user settings to storage
 * Note: API keys should already be encrypted before calling this function
 * @param settings - UserSettings object to save
 */
export async function saveSettings(settings: UserSettings): Promise<void> {
  try {
    const settingsToSave: UserSettings = {
      ...settings,
      lastUpdated: Date.now()
    };
    
    await browser.storage.local.set({
      [STORAGE_KEY_USER_SETTINGS]: settingsToSave
    });
  } catch (error) {
    console.error('Error saving settings to storage:', error);
    throw new Error('Failed to save settings');
  }
}

/**
 * Get decrypted API key for tone analysis
 * @returns Decrypted API key or null if not set
 */
export async function getToneAnalysisApiKey(): Promise<string | null> {
  const settings = await getSettings();
  
  if (!settings || !settings.apiKeyToneAnalysis) {
    console.log('No tone analysis API key found in settings');
    return null;
  }
  
  try {
    const decrypted = await decrypt(settings.apiKeyToneAnalysis);
    console.log('Tone analysis API key decrypted successfully (length:', decrypted.length, 'chars)');
    return decrypted;
  } catch (error) {
    console.error('Error decrypting tone analysis API key:', error);
    return null;
  }
}

/**
 * Get decrypted API key for suggestions
 * @returns Decrypted API key or null if not set
 */
export async function getSuggestionsApiKey(): Promise<string | null> {
  const settings = await getSettings();
  
  if (!settings || !settings.apiKeySuggestions) {
    return null;
  }
  
  try {
    return await decrypt(settings.apiKeySuggestions);
  } catch (error) {
    console.error('Error decrypting suggestions API key:', error);
    return null;
  }
}

/**
 * Update settings with encrypted API keys
 * @param updates - Partial settings update (API keys will be encrypted)
 */
export async function updateSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
  try {
    console.log('updateSettings called with updates:', { ...updates, apiKeyToneAnalysis: updates.apiKeyToneAnalysis ? '***' : undefined, apiKeySuggestions: updates.apiKeySuggestions ? '***' : undefined });
    
    const currentSettings = await getSettingsWithDefaults();
    console.log('Current settings loaded');
    
    // Start with current settings, but only merge non-API-key fields from updates
    // API keys need special handling to avoid overwriting existing encrypted keys
    const newSettings: UserSettings = {
      ...currentSettings,
      // Only merge non-API-key fields
      suggestionProvider: updates.suggestionProvider ?? currentSettings.suggestionProvider,
      sensitivityThreshold: updates.sensitivityThreshold ?? currentSettings.sensitivityThreshold,
      disabledWebsites: updates.disabledWebsites ?? currentSettings.disabledWebsites,
      extensionEnabled: updates.extensionEnabled ?? currentSettings.extensionEnabled,
      // Keep existing API keys unless explicitly updated
      apiKeyToneAnalysis: currentSettings.apiKeyToneAnalysis,
      apiKeySuggestions: currentSettings.apiKeySuggestions
    };
    
    // Encrypt API keys if provided (only update if explicitly provided)
    if (updates.apiKeyToneAnalysis !== undefined) {
      if (updates.apiKeyToneAnalysis) {
        console.log('Encrypting tone analysis API key...');
        try {
          newSettings.apiKeyToneAnalysis = await encrypt(updates.apiKeyToneAnalysis);
          console.log('Tone analysis API key encrypted successfully');
        } catch (error) {
          console.error('Error encrypting tone analysis API key:', error);
          throw new Error('Failed to encrypt tone analysis API key: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
      } else {
        // Explicitly set to undefined to remove the key
        newSettings.apiKeyToneAnalysis = undefined;
      }
    }
    
    if (updates.apiKeySuggestions !== undefined) {
      if (updates.apiKeySuggestions) {
        console.log('Encrypting suggestions API key...');
        try {
          newSettings.apiKeySuggestions = await encrypt(updates.apiKeySuggestions);
          console.log('Suggestions API key encrypted successfully');
        } catch (error) {
          console.error('Error encrypting suggestions API key:', error);
          throw new Error('Failed to encrypt suggestions API key: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
      } else {
        // Explicitly set to undefined to remove the key
        newSettings.apiKeySuggestions = undefined;
      }
    }
    
    console.log('Saving settings to storage...');
    await saveSettings(newSettings);
    console.log('Settings saved successfully');
    return newSettings;
  } catch (error) {
    console.error('Error in updateSettings:', error);
    throw error;
  }
}

