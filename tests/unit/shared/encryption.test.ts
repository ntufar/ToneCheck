/**
 * T099: Unit tests for encryption utilities
 */

import { encrypt, decrypt, isEncrypted } from '../../../src/shared/encryption';

describe('Encryption', () => {
  describe('encrypt', () => {
    it('should encrypt a string', async () => {
      const plaintext = 'test-api-key-123';
      const encrypted = await encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.length).toBeGreaterThan(plaintext.length);
    });

    it('should throw error for empty string', async () => {
      await expect(encrypt('')).rejects.toThrow('Cannot encrypt empty string');
    });

    it('should produce different ciphertext for same input (due to random IV)', async () => {
      const plaintext = 'test-api-key-123';
      const encrypted1 = await encrypt(plaintext);
      const encrypted2 = await encrypt(plaintext);

      // Should be different due to random IV
      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted string', async () => {
      const plaintext = 'test-api-key-123';
      const encrypted = await encrypt(plaintext);
      const decrypted = await decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle special characters', async () => {
      const plaintext = 'test-api-key-!@#$%^&*()';
      const encrypted = await encrypt(plaintext);
      const decrypted = await decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters', async () => {
      const plaintext = 'test-api-key-你好世界';
      const encrypted = await encrypt(plaintext);
      const decrypted = await decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw error for empty string', async () => {
      await expect(decrypt('')).rejects.toThrow('Cannot decrypt empty string');
    });

    it('should throw error for invalid ciphertext', async () => {
      await expect(decrypt('invalid-ciphertext')).rejects.toThrow('Decryption failed');
    });
  });

  describe('isEncrypted', () => {
    it('should return true for encrypted string', async () => {
      const plaintext = 'test-api-key-123';
      const encrypted = await encrypt(plaintext);

      expect(isEncrypted(encrypted)).toBe(true);
    });

    it('should return false for plaintext', () => {
      expect(isEncrypted('plaintext')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isEncrypted('')).toBe(false);
    });

    it('should return false for short strings', () => {
      expect(isEncrypted('short')).toBe(false);
    });
  });

  describe('encrypt/decrypt roundtrip', () => {
    it('should encrypt and decrypt successfully', async () => {
      const testCases = [
        'simple-key',
        'complex-key-with-special-chars-!@#$%',
        'unicode-key-你好世界',
        'very-long-key-' + 'a'.repeat(100)
      ];

      for (const plaintext of testCases) {
        const encrypted = await encrypt(plaintext);
        const decrypted = await decrypt(encrypted);
        expect(decrypted).toBe(plaintext);
      }
    });
  });
});

