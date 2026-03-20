// Wallet Standard adapter — registers KibiPay with the Wallet Standard
// https://wallet-standard.github.io/wallet-standard/

import type { KibiPayProvider } from './provider.js';

const SOLANA_MAINNET = 'solana:mainnet';
const SOLANA_DEVNET = 'solana:devnet';
const SOLANA_TESTNET = 'solana:testnet';

export function registerWalletStandard(provider: KibiPayProvider): void {
  const walletStandard = (window as unknown as { navigator?: { wallets?: { register: (w: unknown) => void } } }).navigator?.wallets;
  if (!walletStandard?.register) return;

  walletStandard.register({
    version: '1.0.0',
    name: 'KibiPay',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">💎</text></svg>' as `data:image/${'svg+xml' | 'webp' | 'png' | 'gif'};base64,${string}`,
    chains: [SOLANA_MAINNET, SOLANA_DEVNET, SOLANA_TESTNET],
    features: {
      'standard:connect': {
        version: '1.0.0',
        connect: async () => {
          const { publicKey } = await provider.connect();
          return {
            accounts: publicKey ? [{
              address: publicKey.toBase58(),
              publicKey: publicKey.toBytes(),
              chains: [SOLANA_MAINNET, SOLANA_DEVNET, SOLANA_TESTNET],
              features: [
                'standard:connect',
                'standard:disconnect',
                'standard:events',
                'solana:signTransaction',
                'solana:signAndSendTransaction',
                'solana:signMessage',
              ],
            }] : [],
          };
        },
      },
      'standard:disconnect': {
        version: '1.0.0',
        disconnect: () => provider.disconnect(),
      },
      'standard:events': {
        version: '1.0.0',
        on: (event: string, cb: (...args: unknown[]) => void) => {
          provider.on(event, cb);
          return () => provider.off(event, cb);
        },
      },
      'solana:signTransaction': {
        version: '1.0.0',
        supportedTransactionVersions: ['legacy', 0],
        signTransaction: async (...inputs: { transaction: unknown }[]) => {
          const results = await Promise.all(
            inputs.map(({ transaction }) => provider.signTransaction(transaction)),
          );
          return results.map((tx) => ({ signedTransaction: serializeTx(tx) }));
        },
      },
      'solana:signAndSendTransaction': {
        version: '1.0.0',
        supportedTransactionVersions: ['legacy', 0],
        signAndSendTransaction: async (...inputs: { transaction: unknown }[]) => {
          const results = await Promise.all(
            inputs.map(({ transaction }) => provider.signAndSendTransaction(transaction)),
          );
          return results.map(({ signature }) => ({ signature: decodeBase58(signature) }));
        },
      },
      'solana:signMessage': {
        version: '1.0.0',
        signMessage: async (...inputs: { message: Uint8Array; account: unknown }[]) => {
          const results = await Promise.all(
            inputs.map(({ message }) => provider.signMessage(message)),
          );
          return results.map(({ signature, publicKey }) => ({
            signedMessage: signature as unknown as Uint8Array,
            signature,
          }));
        },
      },
    },
    accounts: provider.publicKey ? [{
      address: provider.publicKey.toBase58(),
      publicKey: provider.publicKey.toBytes(),
      chains: [SOLANA_MAINNET],
      features: [],
    }] : [],
  });
}

function serializeTx(tx: unknown): Uint8Array {
  const anyTx = tx as { serialize?: () => Uint8Array };
  if (anyTx.serialize) return anyTx.serialize();
  throw new Error('Cannot serialize transaction');
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
