import { useState, useEffect } from 'react';
import type { WalletState } from '@kibipay/shared-types';
import { useMessaging } from './useMessaging.js';

export function useWalletState() {
  const { sendMessage } = useMessaging();
  const [state, setState] = useState<WalletState | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const walletState = await sendMessage<WalletState>('WALLET_GET_STATE');
      setState(walletState);
    } catch {
      // background may be restarting
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return { state, loading, refresh };
}

export function useWalletActions() {
  const { sendMessage } = useMessaging();

  const createWallet = async (password: string, mnemonic?: string) =>
    sendMessage('WALLET_CREATE', { password, mnemonic });

  const importWallet = async (mnemonic: string, password: string) =>
    sendMessage('WALLET_IMPORT', { mnemonic, password });

  const unlock = async (password: string) =>
    sendMessage('WALLET_UNLOCK', { password });

  const lock = async () =>
    sendMessage('WALLET_LOCK');

  const exportMnemonic = async (password: string) =>
    sendMessage<{ mnemonic: string }>('WALLET_EXPORT_MNEMONIC', { password });

  const changePassword = async (currentPassword: string, newPassword: string) =>
    sendMessage('WALLET_CHANGE_PASSWORD', { currentPassword, newPassword });

  const deleteWallet = async () =>
    sendMessage('WALLET_DELETE');

  const getSettings = async () =>
    sendMessage('SETTINGS_GET');

  const updateSettings = async (updates: Record<string, unknown>) =>
    sendMessage('SETTINGS_UPDATE', updates);

  return {
    createWallet,
    importWallet,
    unlock,
    lock,
    exportMnemonic,
    changePassword,
    deleteWallet,
    getSettings,
    updateSettings,
  };
}
