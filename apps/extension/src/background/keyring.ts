import { Keypair } from '@solana/web3.js';
import {
  decryptVault,
  encryptVault,
  zeroBytes,
  mnemonicToSeed,
  deriveKeypairFromSeed,
  toSolanaKeypair,
  publicKeyToBase58,
  normalizeAndValidate,
  generateMnemonic,
  getDerivationPath,
} from '@kibipay/crypto';
import type { VaultData, AccountData } from '@kibipay/shared-types';
import { loadEncryptedVault, saveEncryptedVault } from './vault.js';

interface KeyringState {
  mnemonic: string;
  seed: Uint8Array;
  keypairs: Map<string, Keypair>; // publicKey(base58) → Keypair
  activePublicKey: string;
  accounts: AccountData[];
}

let state: KeyringState | null = null;

export function isLocked(): boolean {
  return state === null;
}

export function getActivePublicKey(): string | null {
  return state?.activePublicKey ?? null;
}

export function getAccounts(): AccountData[] {
  return state?.accounts ?? [];
}

export function getKeypair(publicKey: string): Keypair {
  if (!state) throw new Error('Wallet is locked');
  const keypair = state.keypairs.get(publicKey);
  if (!keypair) throw new Error(`No keypair found for ${publicKey}`);
  return keypair;
}

export function getActiveKeypair(): Keypair {
  if (!state) throw new Error('Wallet is locked');
  return getKeypair(state.activePublicKey);
}

export async function createWallet(password: string, mnemonic?: string): Promise<AccountData[]> {
  const phrase = mnemonic ? normalizeAndValidate(mnemonic) : generateMnemonic(128);
  const seed = await mnemonicToSeed(phrase);

  const derived = deriveKeypairFromSeed(seed, 0);
  const keypair = toSolanaKeypair(derived);
  const publicKey = publicKeyToBase58(derived.publicKey);

  const accounts: AccountData[] = [
    {
      name: 'Account 1',
      derivationPath: getDerivationPath(0),
      publicKey,
    },
  ];

  const vaultData: VaultData = { version: 1, mnemonic: phrase, accounts };
  const encrypted = await encryptVault(JSON.stringify(vaultData), password);
  await saveEncryptedVault(encrypted);

  // Unlock immediately after creation
  state = {
    mnemonic: phrase,
    seed,
    keypairs: new Map([[publicKey, keypair]]),
    activePublicKey: publicKey,
    accounts,
  };

  return accounts;
}

export async function unlock(password: string): Promise<AccountData[]> {
  const encrypted = await loadEncryptedVault();
  if (!encrypted) throw new Error('No wallet found. Please create a wallet first.');

  const plaintext = await decryptVault(encrypted, password);
  const vaultData: VaultData = JSON.parse(plaintext);

  const seed = await mnemonicToSeed(vaultData.mnemonic);
  const keypairs = new Map<string, Keypair>();

  for (const account of vaultData.accounts) {
    const index = vaultData.accounts.indexOf(account);
    const derived = deriveKeypairFromSeed(seed, index);
    const keypair = toSolanaKeypair(derived);
    keypairs.set(account.publicKey, keypair);
  }

  state = {
    mnemonic: vaultData.mnemonic,
    seed,
    keypairs,
    activePublicKey: vaultData.accounts[0]?.publicKey ?? '',
    accounts: vaultData.accounts,
  };

  return vaultData.accounts;
}

export function lock(): void {
  if (!state) return;
  // Zero out sensitive data before releasing
  zeroBytes(state.seed);
  for (const keypair of state.keypairs.values()) {
    zeroBytes(keypair.secretKey);
  }
  state = null;
}

export async function addAccount(password: string): Promise<AccountData> {
  if (!state) throw new Error('Wallet is locked');

  const newIndex = state.accounts.length;
  const derived = deriveKeypairFromSeed(state.seed, newIndex);
  const keypair = toSolanaKeypair(derived);
  const publicKey = publicKeyToBase58(derived.publicKey);

  const newAccount: AccountData = {
    name: `Account ${newIndex + 1}`,
    derivationPath: getDerivationPath(newIndex),
    publicKey,
  };

  state.accounts.push(newAccount);
  state.keypairs.set(publicKey, keypair);

  // Re-encrypt vault with updated accounts
  const encrypted = await loadEncryptedVault();
  if (!encrypted) throw new Error('Vault not found');
  const plaintext = await decryptVault(encrypted, password);
  const vaultData: VaultData = JSON.parse(plaintext);
  vaultData.accounts = state.accounts;
  const newEncrypted = await encryptVault(JSON.stringify(vaultData), password);
  await saveEncryptedVault(newEncrypted);

  return newAccount;
}

export function switchAccount(publicKey: string): void {
  if (!state) throw new Error('Wallet is locked');
  if (!state.keypairs.has(publicKey)) throw new Error('Account not found');
  state.activePublicKey = publicKey;
}

export async function exportMnemonic(password: string): Promise<string> {
  const encrypted = await loadEncryptedVault();
  if (!encrypted) throw new Error('No vault found');
  const plaintext = await decryptVault(encrypted, password);
  const vaultData: VaultData = JSON.parse(plaintext);
  return vaultData.mnemonic;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const encrypted = await loadEncryptedVault();
  if (!encrypted) throw new Error('No vault found');
  const plaintext = await decryptVault(encrypted, currentPassword);
  const newEncrypted = await encryptVault(plaintext, newPassword);
  await saveEncryptedVault(newEncrypted);
}
