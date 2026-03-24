// Uses the Web Crypto API, available in browsers and Node.js 18+

const PBKDF2_ITERATIONS = 600_000;
const SALT_LENGTH = 16;  // bytes (128-bit)
const IV_LENGTH = 12;    // bytes (96-bit, NIST recommended for GCM)
const KEY_LENGTH = 256;  // bits

export interface EncryptedBlob {
  version: number;
  ciphertext: string; // base64
  salt: string;       // base64
  iv: string;         // base64
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(
    atob(b64)
      .split('')
      .map((c) => c.charCodeAt(0)),
  );
}

// Ensure the Uint8Array is backed by a plain ArrayBuffer (not SharedArrayBuffer)
function ensureArrayBuffer(arr: Uint8Array): Uint8Array<ArrayBuffer> {
  if (arr.buffer instanceof ArrayBuffer) {
    return arr as Uint8Array<ArrayBuffer>;
  }
  const copy = new Uint8Array(arr.length);
  copy.set(arr);
  return copy;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: ensureArrayBuffer(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptVault(plaintext: string, password: string): Promise<EncryptedBlob> {
  const salt = ensureArrayBuffer(crypto.getRandomValues(new Uint8Array(SALT_LENGTH)));
  const iv = ensureArrayBuffer(crypto.getRandomValues(new Uint8Array(IV_LENGTH)));
  const key = await deriveKey(password, salt);
  const enc = new TextEncoder();

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext),
  );

  return {
    version: 1,
    ciphertext: toBase64(new Uint8Array(ciphertext)),
    salt: toBase64(salt),
    iv: toBase64(iv),
  };
}

export async function decryptVault(blob: EncryptedBlob, password: string): Promise<string> {
  const salt = fromBase64(blob.salt);
  const iv = fromBase64(blob.iv);
  const ciphertext = fromBase64(blob.ciphertext);
  const key = await deriveKey(password, salt);

  let plaintext: ArrayBuffer;
  try {
    plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  } catch {
    throw new Error('Invalid password or corrupted vault');
  }

  return new TextDecoder().decode(plaintext);
}

/** Overwrite sensitive bytes in memory before releasing the reference. */
export function zeroBytes(bytes: Uint8Array): void {
  bytes.fill(0);
}
