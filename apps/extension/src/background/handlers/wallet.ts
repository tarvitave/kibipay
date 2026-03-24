import type {
  MessageType,
  WalletCreatePayload,
  WalletImportPayload,
  WalletUnlockPayload,
  WalletExportMnemonicPayload,
  WalletChangePasswordPayload,
  SettingsUpdatePayload,
  WalletState,
  AppSettings,
} from '@kibipay/shared-types';
import {
  createWallet,
  unlock,
  lock,
  isLocked,
  getAccounts,
  getActivePublicKey,
  addAccount,
  switchAccount,
  exportMnemonic,
  changePassword,
} from '../keyring.js';
import {
  hasVault,
  clearEncryptedVault,
  loadSettings,
  saveSettings,
} from '../vault.js';
import { cancelAutoLock, scheduleAutoLock } from '../lock.js';

export async function handleWallet(type: MessageType, payload: unknown): Promise<unknown> {
  switch (type) {
    case 'WALLET_CREATE': {
      const { password, mnemonic } = payload as WalletCreatePayload;
      const accounts = await createWallet(password, mnemonic);
      await scheduleAutoLock();
      return { accounts, isLocked: false };
    }

    case 'WALLET_IMPORT': {
      const { mnemonic, password } = payload as WalletImportPayload;
      const accounts = await createWallet(password, mnemonic);
      await scheduleAutoLock();
      return { accounts, isLocked: false };
    }

    case 'WALLET_UNLOCK': {
      const { password } = payload as WalletUnlockPayload;
      const accounts = await unlock(password);
      await scheduleAutoLock();
      return { accounts, isLocked: false };
    }

    case 'WALLET_LOCK': {
      lock();
      cancelAutoLock();
      return { isLocked: true };
    }

    case 'WALLET_GET_STATE': {
      const settings = await loadSettings();
      const state: WalletState = {
        isLocked: isLocked(),
        hasVault: await hasVault(),
        activeAccount: isLocked()
          ? null
          : (getAccounts().find((a) => a.publicKey === getActivePublicKey()) ?? null),
        accounts: isLocked() ? [] : getAccounts(),
        network: settings.network,
      };
      return state;
    }

    case 'WALLET_ADD_ACCOUNT': {
      const { password } = payload as WalletUnlockPayload;
      const account = await addAccount(password);
      return { account, accounts: getAccounts() };
    }

    case 'WALLET_SWITCH_ACCOUNT': {
      const { publicKey } = payload as { publicKey: string };
      switchAccount(publicKey);
      return { activePublicKey: publicKey };
    }

    case 'WALLET_EXPORT_MNEMONIC': {
      const { password } = payload as WalletExportMnemonicPayload;
      const mnemonic = await exportMnemonic(password);
      return { mnemonic };
    }

    case 'WALLET_CHANGE_PASSWORD': {
      const { currentPassword, newPassword } = payload as WalletChangePasswordPayload;
      await changePassword(currentPassword, newPassword);
      return { success: true };
    }

    case 'WALLET_DELETE': {
      lock();
      cancelAutoLock();
      await clearEncryptedVault();
      return { success: true };
    }

    case 'SETTINGS_GET': {
      const settings = await loadSettings();
      return settings;
    }

    case 'SETTINGS_UPDATE': {
      const updates = payload as SettingsUpdatePayload;
      const current = await loadSettings();
      const updated: AppSettings = { ...current, ...updates };
      await saveSettings(updated);
      if (updates.autoLockMinutes !== undefined) {
        await scheduleAutoLock();
      }
      return updated;
    }

    default:
      throw new Error(`Unhandled wallet message type: ${type}`);
  }
}
