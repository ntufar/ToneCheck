/**
 * T100: Contract tests for Perspective API integration
 */

import { analyzeTone } from '../../src/background/api-client';
import { MAX_TEXT_LENGTH, CHUNK_SIZE } from '../../src/shared/constants';

// Mock fetch globally
global.fetch = jest.fn();

// Mock storage
jest.mock('../../src/background/storage', () => ({
  getToneAnalysisApiKey: jest.fn().mockResolvedValue('mock-api-key')
}));

describe('Perspective API Contract Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeTone', () => {
    it('should format request correctly', async () => {
      const mockResponse = {
        attributeScores: {
          TOXICITY: { summaryScore: { value: 0.5 } },
          SEVERE_TOXICITY: { summaryScore: { value: 0.3 } },
          IDENTITY_ATTACK: { summaryScore: { value: 0.2 } },
          INSULT: { summaryScore: { value: 0.6 } },
          PROFANITY: { summaryScore: { value: 0.4 } },
          THREAT: { summaryScore: { value: 0.1 } }
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await analyzeTone('test text', 'field-1', 'req-1');

      expect(result.toxicity).toBe(0.5);
      expect(result.insult).toBe(0.6);
      expect(result.threat).toBe(0.1);
      expect(result.overallAggression).toBe(60); // max(0.5, 0.6, 0.1) * 100
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: { message: 'Invalid API key' } })
      });

      await expect(analyzeTone('test', 'field-1', 'req-1')).rejects.toThrow('Invalid Perspective API key');
    });

    it('should handle chunking for long text', async () => {
      const longText = 'a'.repeat(CHUNK_SIZE + 100);
      
      const mockResponse = {
        attributeScores: {
          TOXICITY: { summaryScore: { value: 0.5 } },
          SEVERE_TOXICITY: { summaryScore: { value: 0.3 } },
          IDENTITY_ATTACK: { summaryScore: { value: 0.2 } },
          INSULT: { summaryScore: { value: 0.6 } },
          PROFANITY: { summaryScore: { value: 0.4 } },
          THREAT: { summaryScore: { value: 0.1 } }
        }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const result = await analyzeTone(longText, 'field-1', 'req-1');

      // Should make multiple API calls (one per chunk)
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.overallAggression).toBe(60);
    });

    it('should validate text length', async () => {
      const tooLongText = 'a'.repeat(MAX_TEXT_LENGTH + 1);

      await expect(analyzeTone(tooLongText, 'field-1', 'req-1')).rejects.toThrow(`Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters`);
    });

    it('should normalize special characters', async () => {
      const textWithEmojis = 'Hello 😀 world 🌍';
      
      const mockResponse = {
        attributeScores: {
          TOXICITY: { summaryScore: { value: 0.1 } },
          SEVERE_TOXICITY: { summaryScore: { value: 0.1 } },
          IDENTITY_ATTACK: { summaryScore: { value: 0.1 } },
          INSULT: { summaryScore: { value: 0.1 } },
          PROFANITY: { summaryScore: { value: 0.1 } },
          THREAT: { summaryScore: { value: 0.1 } }
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await analyzeTone(textWithEmojis, 'field-1', 'req-1');

      expect(result).toBeDefined();
      // Verify request body includes normalized text
      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.comment.text).toBe(textWithEmojis.normalize('NFC'));
    });
  });
});

