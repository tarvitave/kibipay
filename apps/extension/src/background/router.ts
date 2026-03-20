import type { ExtensionMessage, ExtensionResponse, MessageType } from '@kibipay/shared-types';
import { handleWallet } from './handlers/wallet.js';
import { handleSolana } from './handlers/solana.js';
import { handleDApp } from './handlers/dapp.js';
import { handleStripe } from './handlers/stripe.js';
import { resetAutoLockTimer } from './lock.js';

type Handler = (payload: unknown) => Promise<unknown>;

const WALLET_TYPES = new Set<MessageType>([
  'WALLET_CREATE', 'WALLET_IMPORT', 'WALLET_UNLOCK', 'WALLET_LOCK',
  'WALLET_GET_STATE', 'WALLET_ADD_ACCOUNT', 'WALLET_SWITCH_ACCOUNT',
  'WALLET_EXPORT_MNEMONIC', 'WALLET_CHANGE_PASSWORD', 'WALLET_DELETE',
  'SETTINGS_GET', 'SETTINGS_UPDATE',
]);

const SOL_TYPES = new Set<MessageType>([
  'SOL_GET_BALANCE', 'SOL_GET_TOKENS', 'SOL_GET_HISTORY',
  'SOL_SIMULATE', 'SOL_SIGN_AND_SEND', 'SOL_SIGN_TRANSACTION',
]);

const DAPP_TYPES = new Set<MessageType>([
  'DAPP_CONNECT', 'DAPP_DISCONNECT', 'DAPP_GET_PERMISSIONS', 'DAPP_REVOKE_PERMISSION',
  'DAPP_APPROVE_CONNECTION', 'DAPP_REJECT_CONNECTION',
  'DAPP_SIGN_TRANSACTION', 'DAPP_SIGN_ALL_TRANSACTIONS', 'DAPP_SIGN_AND_SEND_TRANSACTION',
  'DAPP_APPROVE_TRANSACTION', 'DAPP_REJECT_TRANSACTION',
  'DAPP_SIGN_MESSAGE', 'DAPP_APPROVE_SIGN_MESSAGE', 'DAPP_REJECT_SIGN_MESSAGE',
]);

function getHandler(type: MessageType): Handler {
  if (WALLET_TYPES.has(type)) return (p) => handleWallet(type, p);
  if (SOL_TYPES.has(type)) return (p) => handleSolana(type, p);
  if (DAPP_TYPES.has(type)) return (p) => handleDApp(type, p);
  if (type === 'STRIPE_GET_SESSION') return (p) => handleStripe(p);
  throw new Error(`Unknown message type: ${type}`);
}

export function registerMessageRouter(): void {
  chrome.runtime.onMessage.addListener(
    (message: ExtensionMessage, _sender, sendResponse) => {
      const { id, type, payload } = message;

      // Reset auto-lock on any activity from popup
      resetAutoLockTimer();

      (async () => {
        try {
          const handler = getHandler(type);
          const data = await handler(payload);
          const response: ExtensionResponse = { id, success: true, data };
          sendResponse(response);
        } catch (err) {
          const response: ExtensionResponse = {
            id,
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          };
          sendResponse(response);
        }
      })();

      return true; // keep message channel open for async response
    },
  );
}
