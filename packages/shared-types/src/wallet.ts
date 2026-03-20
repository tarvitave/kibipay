export type Network = 'mainnet-beta' | 'devnet' | 'testnet';

export interface VaultData {
  version: number;
  mnemonic: string;
  accounts: AccountData[];
}

export interface AccountData {
  name: string;
  derivationPath: string;
  publicKey: string; // base58
}

export interface EncryptedVault {
  version: number;
  ciphertext: string; // base64
  salt: string;       // base64
  iv: string;         // base64
}

export interface WalletState {
  isLocked: boolean;
  hasVault: boolean;
  activeAccount: AccountData | null;
  accounts: AccountData[];
  network: Network;
}

export interface AppSettings {
  autoLockMinutes: number;
  rpcEndpoint: string | null; // null = use default for network
  network: Network;
  backendUrl: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  autoLockMinutes: 15,
  rpcEndpoint: null,
  network: 'mainnet-beta',
  backendUrl: 'https://api.kibipay.com',
};
