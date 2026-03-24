import { Keypair as SolanaKeypair, PublicKey } from '@solana/web3.js';
import type { DerivedKeypair } from './derivation.js';

export function toSolanaKeypair(derived: DerivedKeypair): SolanaKeypair {
  return SolanaKeypair.fromSecretKey(derived.secretKey);
}

export function publicKeyToBase58(publicKey: Uint8Array): string {
  return new PublicKey(publicKey).toBase58();
}

export function isValidPublicKey(address: string): boolean {
  try {
    const pubkey = new PublicKey(address);
    return PublicKey.isOnCurve(pubkey.toBytes());
  } catch {
    return false;
  }
}

export function base58ToPublicKey(address: string): PublicKey {
  return new PublicKey(address);
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
