/**
 * T097: Unit tests for rate limiter
 */

import { RateLimiter } from '../../../src/background/rate-limiter';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter(1); // 1 QPS for testing
  });

  afterEach(() => {
    rateLimiter.clearQueue();
  });

  describe('enqueue', () => {
    it('should execute requests in order', async () => {
      const results: number[] = [];

      await Promise.all([
        rateLimiter.enqueue(async () => {
          results.push(1);
          return 1;
        }),
        rateLimiter.enqueue(async () => {
          results.push(2);
          return 2;
        }),
        rateLimiter.enqueue(async () => {
          results.push(3);
          return 3;
        })
      ]);

      expect(results).toEqual([1, 2, 3]);
    });

    it('should respect rate limit', async () => {
      const startTime = Date.now();
      const timestamps: number[] = [];

      await Promise.all([
        rateLimiter.enqueue(async () => {
          timestamps.push(Date.now() - startTime);
          return 1;
        }),
        rateLimiter.enqueue(async () => {
          timestamps.push(Date.now() - startTime);
          return 2;
        }),
        rateLimiter.enqueue(async () => {
          timestamps.push(Date.now() - startTime);
          return 3;
        })
      ]);

      // Should take at least 2 seconds (1 QPS = 1000ms between requests)
      expect(timestamps[2] - timestamps[0]).toBeGreaterThanOrEqual(1800); // Allow some margin
    });

    it('should handle request errors', async () => {
      const error = new Error('Test error');

      await expect(
        rateLimiter.enqueue(async () => {
          throw error;
        })
      ).rejects.toThrow('Test error');
    });

    it('should return correct values', async () => {
      const result = await rateLimiter.enqueue(async () => {
        return 'test';
      });

      expect(result).toBe('test');
    });
  });

  describe('getQueueLength', () => {
    it('should return correct queue length', async () => {
      // Start multiple requests
      const promises = [
        rateLimiter.enqueue(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return 1;
        }),
        rateLimiter.enqueue(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return 2;
        })
      ];

      // Queue should have pending requests
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(rateLimiter.getQueueLength()).toBeGreaterThan(0);

      // Wait for completion
      await Promise.all(promises);
      expect(rateLimiter.getQueueLength()).toBe(0);
    });
  });

  describe('clearQueue', () => {
    it('should cancel pending requests', async () => {
      const promises = [
        rateLimiter.enqueue(async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return 1;
        }),
        rateLimiter.enqueue(async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return 2;
        })
      ];

      // Clear queue before completion
      rateLimiter.clearQueue();

      // All requests should be rejected
      await expect(Promise.all(promises)).rejects.toBeDefined();
    });
  });
});

