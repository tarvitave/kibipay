import type { Network } from './wallet.js';

export type MessageType =
  // Wallet management
  | 'WALLET_CREATE'
  | 'WALLET_IMPORT'
  | 'WALLET_UNLOCK'
  | 'WALLET_LOCK'
  | 'WALLET_GET_STATE'
  | 'WALLET_ADD_ACCOUNT'
  | 'WALLET_SWITCH_ACCOUNT'
  | 'WALLET_EXPORT_MNEMONIC'
  | 'WALLET_CHANGE_PASSWORD'
  | 'WALLET_DELETE'
  // Solana operations
  | 'SOL_GET_BALANCE'
  | 'SOL_GET_TOKENS'
  | 'SOL_GET_HISTORY'
  | 'SOL_SIMULATE'
  | 'SOL_SIGN_AND_SEND'
  | 'SOL_SIGN_TRANSACTION'
  // dApp connectivity
  | 'DAPP_CONNECT'
  | 'DAPP_DISCONNECT'
  | 'DAPP_GET_PERMISSIONS'
  | 'DAPP_REVOKE_PERMISSION'
  | 'DAPP_APPROVE_CONNECTION'
  | 'DAPP_REJECT_CONNECTION'
  | 'DAPP_SIGN_TRANSACTION'
  | 'DAPP_SIGN_ALL_TRANSACTIONS'
  | 'DAPP_SIGN_AND_SEND_TRANSACTION'
  | 'DAPP_APPROVE_TRANSACTION'
  | 'DAPP_REJECT_TRANSACTION'
  | 'DAPP_SIGN_MESSAGE'
  | 'DAPP_APPROVE_SIGN_MESSAGE'
  | 'DAPP_REJECT_SIGN_MESSAGE'
  // Stripe
  | 'STRIPE_GET_SESSION'
  // Settings
  | 'SETTINGS_GET'
  | 'SETTINGS_UPDATE';

export type MessageSource = 'kibipay-popup' | 'kibipay-content' | 'kibipay-page' | 'kibipay-background';

export interface ExtensionMessage<T = unknown> {
  source: MessageSource;
  type: MessageType;
  id: string;
  payload: T;
}

export interface ExtensionResponse<T = unknown> {
  id: string;
  success: boolean;
  data?: T;
  error?: string;
}

// ── Payload types ────────────────────────────────────────────────────────────

export interface WalletCreatePayload {
  password: string;
  mnemonic?: string; // if omitted, one is generated
}

export interface WalletImportPayload {
  mnemonic: string;
  password: string;
}

export interface WalletUnlockPayload {
  password: string;
}

export interface WalletExportMnemonicPayload {
  password: string;
}

export interface WalletChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface SolTransferPayload {
  to: string;
  lamports?: string;   // bigint as string — for SOL transfers
  mint?: string;       // if SPL token
  decimals?: number;   // token decimals
  tokenAmount?: string; // human-readable token amount for SPL
}

export interface SolSimulatePayload {
  serializedTransaction: string; // base64
}

export interface SolSignAndSendPayload {
  serializedTransaction: string; // base64
}

export interface SolGetHistoryPayload {
  limit?: number;
}

export interface DAppConnectPayload {
  origin: string;
  favicon?: string;
  name?: string;
}

export interface DAppSignTransactionPayload {
  origin: string;
  serializedTransaction: string; // base64
  requestId: string;
}

export interface DAppSignAllTransactionsPayload {
  origin: string;
  serializedTransactions: string[]; // base64[]
  requestId: string;
}

export interface DAppSignMessagePayload {
  origin: string;
  message: string; // base64
  requestId: string;
}

export interface DAppApprovePayload {
  requestId: string;
}

export interface DAppRejectPayload {
  requestId: string;
  reason?: string;
}

export interface StripeSessionPayload {
  walletAddress: string;
  currency?: 'sol' | 'usdc';
  amount?: number;
}

export interface SettingsUpdatePayload {
  autoLockMinutes?: number;
  rpcEndpoint?: string | null;
  network?: Network;
  backendUrl?: string;
}
