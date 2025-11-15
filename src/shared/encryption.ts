/**
 * Encryption utilities using Web Crypto API
 * Used to encrypt/decrypt API keys before storage
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM

/**
 * Generate a key from a password using PBKDF2
 * In a real implementation, this would use a more secure key derivation
 * For MVP, we use a simple approach with a fixed salt (stored in extension)
 */
async function deriveKey(password: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  // Use a fixed salt stored in the extension (not user-specific)
  // In production, consider using a more secure approach
  const salt = encoder.encode('tonecheck-extension-salt-v1');
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    {
      name: ALGORITHM,
      length: KEY_LENGTH
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate a random IV for encryption
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Encrypt a string value (API key)
 * @param plaintext - The plaintext to encrypt
 * @param password - Password for key derivation (can be a fixed value for extension)
 * @returns Encrypted string (base64 encoded IV + ciphertext)
 */
export async function encrypt(plaintext: string, password: string = 'tonecheck-default-key'): Promise<string> {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty string');
  }
  
  const key = await deriveKey(password);
  const iv = generateIV();
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  
  const encrypted = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv
    },
    key,
    data
  );
  
  // Combine IV and ciphertext, then base64 encode
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt an encrypted string
 * @param ciphertext - The encrypted string (base64 encoded IV + ciphertext)
 * @param password - Password for key derivation (must match encryption password)
 * @returns Decrypted plaintext string
 */
export async function decrypt(ciphertext: string, password: string = 'tonecheck-default-key'): Promise<string> {
  if (!ciphertext) {
    throw new Error('Cannot decrypt empty string');
  }
  
  try {
    const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    const iv = combined.slice(0, IV_LENGTH);
    const encrypted = combined.slice(IV_LENGTH);
    
    const key = await deriveKey(password);
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv
      },
      key,
      encrypted
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if a string is encrypted (basic heuristic)
 * This is a simple check - encrypted strings are base64 encoded
 */
export function isEncrypted(value: string): boolean {
  if (!value || value.length < 20) {
    return false;
  }
  
  // Basic check: encrypted strings are base64 and longer
  // In practice, we know our encrypted format, so we can check more specifically
  try {
    const decoded = atob(value);
    return decoded.length > IV_LENGTH;
  } catch {
    return false;
  }
}

