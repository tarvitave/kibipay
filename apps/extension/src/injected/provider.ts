// Injected provider — runs in MAIN world (page context)
// Implements the window.solana Phantom-compatible API

import type { ExtensionMessage, ExtensionResponse, MessageType } from '@kibipay/shared-types';

const PAGE_SOURCE = 'kibipay-page';
const CONTENT_SOURCE = 'kibipay-content';

type EventCallback = (...args: unknown[]) => void;

class EventEmitter {
  private listeners = new Map<string, Set<EventCallback>>();

  on(event: string, cb: EventCallback): EventEmitter {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(cb);
    return this;
  }

  off(event: string, cb: EventCallback): EventEmitter {
    this.listeners.get(event)?.delete(cb);
    return this;
  }

  emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach((cb) => cb(...args));
  }
}

class KibiPayProvider extends EventEmitter {
  readonly isKibiPay = true;
  readonly isPhantom = true; // compatibility flag for dApps checking for Phantom

  publicKey: { toBase58: () => string; toBytes: () => Uint8Array } | null = null;
  isConnected = false;

  private send<T>(type: MessageType, payload: unknown = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      const message: ExtensionMessage = {
        source: PAGE_SOURCE,
        type,
        id,
        payload,
      };

      const handler = (event: MessageEvent) => {
        if (
          event.source !== window ||
          !event.data ||
          event.data.source !== CONTENT_SOURCE ||
          event.data.id !== id
        ) {
          return;
        }
        window.removeEventListener('message', handler);
        const response = event.data as ExtensionResponse<T>;
        if (response.success) {
          resolve(response.data as T);
        } else {
          reject(new Error(response.error ?? 'Unknown error'));
        }
      };

      window.addEventListener('message', handler);
      window.postMessage(message, '*');

      // 30-second timeout for non-approval requests
      setTimeout(() => {
        window.removeEventListener('message', handler);
        reject(new Error('Request timed out'));
      }, 30_000);
    });
  }

  async connect(opts?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toBase58: () => string; toBytes: () => Uint8Array } | null }> {
    const origin = window.location.origin;
    const result = await this.send<{ publicKey: string; connected: boolean }>('DAPP_CONNECT', {
      origin,
      favicon: (document.querySelector('link[rel="icon"]') as HTMLLinkElement | null)?.href,
      name: document.title,
    });

    this.publicKey = createPublicKeyProxy(result.publicKey);
    this.isConnected = true;
    this.emit('connect', this.publicKey);
    return { publicKey: this.publicKey };
  }

  async disconnect(): Promise<void> {
    await this.send('DAPP_DISCONNECT', { origin: window.location.origin });
    this.publicKey = null;
    this.isConnected = false;
    this.emit('disconnect');
  }

  async signTransaction<T>(transaction: T): Promise<T> {
    if (!this.isConnected) throw new Error('Not connected');
    const requestId = crypto.randomUUID();
    const serialized = serializeForExtension(transaction);
    const result = await this.send<{ serializedTransaction: string }>('DAPP_SIGN_TRANSACTION', {
      origin: window.location.origin,
      serializedTransaction: serialized,
      requestId,
    });
    return deserializeFromExtension(result.serializedTransaction, transaction) as T;
  }

  async signAllTransactions<T>(transactions: T[]): Promise<T[]> {
    if (!this.isConnected) throw new Error('Not connected');
    return Promise.all(transactions.map((tx) => this.signTransaction(tx)));
  }

  async signAndSendTransaction(
    transaction: unknown,
    options?: { skipPreflight?: boolean },
  ): Promise<{ signature: string }> {
    if (!this.isConnected) throw new Error('Not connected');
    const requestId = crypto.randomUUID();
    const serialized = serializeForExtension(transaction);
    return this.send('DAPP_SIGN_AND_SEND_TRANSACTION', {
      origin: window.location.origin,
      serializedTransaction: serialized,
      requestId,
    });
  }

  async signMessage(
    message: Uint8Array,
    encoding?: 'utf8' | 'hex',
  ): Promise<{ signature: Uint8Array; publicKey: { toBase58: () => string; toBytes: () => Uint8Array } | null }> {
    if (!this.isConnected) throw new Error('Not connected');
    const requestId = crypto.randomUUID();
    const result = await this.send<{ signature: string; publicKey: string }>('DAPP_SIGN_MESSAGE', {
      origin: window.location.origin,
      message: Buffer.from(message).toString('base64'),
      requestId,
    });
    return {
      signature: Buffer.from(result.signature, 'base64'),
      publicKey: createPublicKeyProxy(result.publicKey),
    };
  }
}

function createPublicKeyProxy(base58: string) {
  return {
    toBase58: () => base58,
    toBytes: () => decodeBase58(base58),
    toString: () => base58,
  };
}

function decodeBase58(str: string): Uint8Array {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const bytes: number[] = [0];
  for (const char of str) {
    let carry = ALPHABET.indexOf(char);
    for (let i = 0; i < bytes.length; ++i) {
      carry += bytes[i] * 58;
      bytes[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (const char of str) {
    if (char === '1') bytes.push(0); else break;
  }
  return new Uint8Array(bytes.reverse());
}

function serializeForExtension(tx: unknown): string {
  // @solana/web3.js Transaction or VersionedTransaction
  const anyTx = tx as { serialize?: (opts?: { requireAllSignatures: boolean }) => Uint8Array };
  if (anyTx.serialize) {
    try {
      return Buffer.from(anyTx.serialize({ requireAllSignatures: false })).toString('base64');
    } catch {
      return Buffer.from(anyTx.serialize!()).toString('base64');
    }
  }
  throw new Error('Cannot serialize transaction');
}

function deserializeFromExtension(serialized: string, _original: unknown): unknown {
  // Return as-is; dApps will handle deserialization using their own @solana/web3.js
  return { serialize: () => Buffer.from(serialized, 'base64') };
}

export { KibiPayProvider };
