// Web Crypto API helpers for client-side hashing and encryption

// Helper to convert ArrayBuffer to Hex string
export function bufferToHex(buffer: ArrayBuffer): string {
  const hashArray = Array.from(new Uint8Array(buffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper to convert Hex string to Uint8Array
export function hexToBuffer(hexString: string): Uint8Array {
  const bytes = new Uint8Array(Math.ceil(hexString.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hexString.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// Generate random salt (16 bytes)
export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return bufferToHex(salt);
}

// Generate random nonce (12 bytes for AES-GCM)
export function generateNonce(): string {
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  return bufferToHex(nonce);
}

// PBKDF2 key derivation for hashing or encryption
export async function deriveKey(password: string, saltHex: string, usage: 'hash' | 'encrypt'): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const saltBuffer = hexToBuffer(saltHex);

  if (usage === 'hash') {
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'HMAC', hash: 'SHA-256', length: 256 },
      true,
      ['sign']
    );
  } else {
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
}

export async function hashPassword(password: string, saltHex: string): Promise<string> {
  const key = await deriveKey(password, saltHex, 'hash');
  // Export key to get the raw bits as hash (since we derived an HMAC key we can just export it)
  const rawKey = await crypto.subtle.exportKey('raw', key);
  return bufferToHex(rawKey);
}

export async function encryptState(stateJson: string, password: string, saltHex: string): Promise<{ ciphertext: string, nonce: string }> {
  const key = await deriveKey(password, saltHex, 'encrypt');
  const nonceHex = generateNonce();
  const nonceBuffer = hexToBuffer(nonceHex);
  const enc = new TextEncoder();

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: nonceBuffer
    },
    key,
    enc.encode(stateJson)
  );

  return {
    ciphertext: bufferToHex(encryptedBuffer),
    nonce: nonceHex
  };
}

export async function decryptState(ciphertextHex: string, nonceHex: string, password: string, saltHex: string): Promise<string> {
  const key = await deriveKey(password, saltHex, 'encrypt');
  const nonceBuffer = hexToBuffer(nonceHex);
  const encryptedBuffer = hexToBuffer(ciphertextHex);

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: nonceBuffer
    },
    key,
    encryptedBuffer
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}
