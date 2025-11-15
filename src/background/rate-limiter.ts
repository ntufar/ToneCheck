/**
 * Rate limiter implementation
 * Manages 1 QPS (query per second) queue for API requests
 */

type QueuedRequest<T> = {
  id: string;
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  timestamp: number;
};

export class RateLimiter {
  private queue: QueuedRequest<unknown>[] = [];
  private processing = false;
  private lastRequestTime = 0;
  private readonly minInterval: number; // milliseconds between requests

  constructor(queriesPerSecond: number = 1) {
    this.minInterval = 1000 / queriesPerSecond; // Convert QPS to milliseconds
  }

  /**
   * Add a request to the queue
   * @param execute - Function that executes the API request
   * @returns Promise that resolves when the request completes
   */
  async enqueue<T>(execute: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const request: QueuedRequest<T> = {
        id: `req-${Date.now()}-${Math.random()}`,
        execute,
        resolve,
        reject,
        timestamp: Date.now()
      };

      this.queue.push(request as QueuedRequest<unknown>);
      this.processQueue();
    });
  }

  /**
   * Process the queue, executing requests at the rate limit
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (!request) {
        break;
      }

      // Wait until enough time has passed since the last request
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.minInterval) {
        const waitTime = this.minInterval - timeSinceLastRequest;
        await this.sleep(waitTime);
      }

      // Execute the request
      try {
        this.lastRequestTime = Date.now();
        const result = await request.execute();
        request.resolve(result);
      } catch (error) {
        request.reject(error instanceof Error ? error : new Error(String(error)));
      }
    }

    this.processing = false;
  }

  /**
   * Get the current queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Clear the queue (cancel pending requests)
   */
  clearQueue(): void {
    this.queue.forEach(request => {
      request.reject(new Error('Queue cleared'));
    });
    this.queue = [];
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance for the extension
export const rateLimiter = new RateLimiter(1); // 1 QPS

