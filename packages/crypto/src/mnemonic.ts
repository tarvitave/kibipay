import * as bip39 from 'bip39';

export type MnemonicStrength = 128 | 256; // 12 or 24 words

export function generateMnemonic(strength: MnemonicStrength = 128): string {
  return bip39.generateMnemonic(strength);
}

export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(normalizeMnemonic(mnemonic));
}

export async function mnemonicToSeed(mnemonic: string, passphrase = ''): Promise<Uint8Array> {
  const buffer = await bip39.mnemonicToSeed(mnemonic, passphrase);
  return new Uint8Array(buffer);
}

export function normalizeMnemonic(mnemonic: string): string {
  return mnemonic.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function normalizeAndValidate(mnemonic: string): string {
  const normalized = normalizeMnemonic(mnemonic);
  if (!bip39.validateMnemonic(normalized)) {
    throw new Error('Invalid mnemonic phrase. Please check each word and try again.');
  }
  return normalized;
}

export function wordCount(mnemonic: string): number {
  return normalizeMnemonic(mnemonic).split(' ').filter(Boolean).length;
}
