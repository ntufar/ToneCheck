/**
 * T098: Unit tests for storage layer
 */

import * as storage from '../../../src/background/storage';
import { STORAGE_KEY_USER_SETTINGS, DEFAULT_SETTINGS } from '../../../src/shared/constants';
import browser from 'webextension-polyfill';

// Mock webextension-polyfill
jest.mock('webextension-polyfill', () => ({
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  }
}));

describe('Storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should return null if settings not found', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});

      const result = await storage.getSettings();
      expect(result).toBeNull();
    });

    it('should return settings if found', async () => {
      const mockSettings = {
        extensionEnabled: true,
        suggestionProvider: 'gemini',
        sensitivityThreshold: 'medium',
        disabledWebsites: [],
        lastUpdated: Date.now()
      };

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEY_USER_SETTINGS]: mockSettings
      });

      const result = await storage.getSettings();
      expect(result).toEqual(mockSettings);
    });

    it('should handle storage errors', async () => {
      (browser.storage.local.get as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await storage.getSettings();
      expect(result).toBeNull();
    });
  });

  describe('getSettingsWithDefaults', () => {
    it('should return defaults if settings not found', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});

      const result = await storage.getSettingsWithDefaults();
      expect(result.suggestionProvider).toBe(DEFAULT_SETTINGS.suggestionProvider);
      expect(result.sensitivityThreshold).toBe(DEFAULT_SETTINGS.sensitivityThreshold);
      expect(result.extensionEnabled).toBe(DEFAULT_SETTINGS.extensionEnabled);
      expect(result.disabledWebsites).toEqual(DEFAULT_SETTINGS.disabledWebsites);
    });

    it('should merge settings with defaults', async () => {
      const mockSettings = {
        extensionEnabled: false,
        lastUpdated: Date.now()
      };

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEY_USER_SETTINGS]: mockSettings
      });

      const result = await storage.getSettingsWithDefaults();
      expect(result.extensionEnabled).toBe(false);
      expect(result.suggestionProvider).toBe(DEFAULT_SETTINGS.suggestionProvider);
    });
  });

  describe('saveSettings', () => {
    it('should save settings to storage', async () => {
      const mockSettings = {
        extensionEnabled: true,
        suggestionProvider: 'gemini' as const,
        sensitivityThreshold: 'medium' as const,
        disabledWebsites: [],
        lastUpdated: Date.now()
      };

      (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

      await storage.saveSettings(mockSettings);

      expect(browser.storage.local.set).toHaveBeenCalledWith({
        [STORAGE_KEY_USER_SETTINGS]: expect.objectContaining({
          ...mockSettings
        })
      });
    });

    it('should update lastUpdated timestamp', async () => {
      const mockSettings = {
        extensionEnabled: true,
        suggestionProvider: 'gemini' as const,
        sensitivityThreshold: 'medium' as const,
        disabledWebsites: [],
        lastUpdated: 1000
      };

      (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

      await storage.saveSettings(mockSettings);

      const callArgs = (browser.storage.local.set as jest.Mock).mock.calls[0][0];
      expect(callArgs[STORAGE_KEY_USER_SETTINGS].lastUpdated).toBeGreaterThan(1000);
    });

    it('should throw error on storage failure', async () => {
      const mockSettings = {
        extensionEnabled: true,
        suggestionProvider: 'gemini' as const,
        sensitivityThreshold: 'medium' as const,
        disabledWebsites: [],
        lastUpdated: Date.now()
      };

      (browser.storage.local.set as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(storage.saveSettings(mockSettings)).rejects.toThrow('Failed to save settings');
    });
  });
});

