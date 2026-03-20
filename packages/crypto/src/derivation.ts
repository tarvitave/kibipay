import { derivePath } from 'ed25519-hd-key';
import nacl from 'tweetnacl';

export const SOLANA_PURPOSE = 44;
export const SOLANA_COIN_TYPE = 501;

export function getDerivationPath(accountIndex: number): string {
  return `m/${SOLANA_PURPOSE}'/${SOLANA_COIN_TYPE}'/${accountIndex}'/0'`;
}

export interface DerivedKeypair {
  publicKey: Uint8Array;  // 32 bytes
  secretKey: Uint8Array;  // 64 bytes: seed(32) + publicKey(32)
  derivationPath: string;
}

export function deriveKeypairFromSeed(seed: Uint8Array, accountIndex: number): DerivedKeypair {
  const path = getDerivationPath(accountIndex);
  const { key } = derivePath(path, Buffer.from(seed).toString('hex'));
  const keypair = nacl.sign.keyPair.fromSeed(Uint8Array.from(key));
  return {
    publicKey: keypair.publicKey,
    secretKey: keypair.secretKey,
    derivationPath: path,
  };
}

export function deriveMultipleKeypairs(seed: Uint8Array, count: number): DerivedKeypair[] {
  return Array.from({ length: count }, (_, i) => deriveKeypairFromSeed(seed, i));
}
