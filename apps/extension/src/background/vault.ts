import type { EncryptedVault, AppSettings } from '@kibipay/shared-types';
import { DEFAULT_SETTINGS } from '@kibipay/shared-types';

const VAULT_KEY = 'kibipay_vault';
const SETTINGS_KEY = 'kibipay_settings';

export async function loadEncryptedVault(): Promise<EncryptedVault | null> {
  const result = await chrome.storage.local.get(VAULT_KEY);
  return (result[VAULT_KEY] as EncryptedVault | undefined) ?? null;
}

export async function saveEncryptedVault(vault: EncryptedVault): Promise<void> {
  await chrome.storage.local.set({ [VAULT_KEY]: vault });
}

export async function clearEncryptedVault(): Promise<void> {
  await chrome.storage.local.remove(VAULT_KEY);
}

export async function hasVault(): Promise<boolean> {
  const vault = await loadEncryptedVault();
  return vault !== null;
}

export async function loadSettings(): Promise<AppSettings> {
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(result[SETTINGS_KEY] as Partial<AppSettings> | undefined) };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}
