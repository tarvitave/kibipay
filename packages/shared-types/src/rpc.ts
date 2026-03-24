export interface TokenAccount {
  mint: string;
  ata: string;
  balance: string; // bigint serialized as string
  decimals: number;
  symbol: string;
  name: string;
  logoURI: string | null;
  uiAmount: number;
}

export interface ParsedTransaction {
  signature: string;
  slot: number;
  blockTime: number | null;
  type: TransactionType;
  amount: string | null;
  token: string | null;
  tokenSymbol: string | null;
  counterparty: string | null;
  fee: number;
  status: 'confirmed' | 'failed';
}

export type TransactionType = 'send' | 'receive' | 'swap' | 'unknown';

export interface SimulationResult {
  fee: number;
  balanceChanges: BalanceChange[];
  logs: string[];
  error: string | null;
  unitsConsumed: number | null;
}

export interface BalanceChange {
  account: string;
  pre: string;   // bigint as string
  post: string;  // bigint as string
  change: string; // signed bigint as string
  mint: string | null; // null = SOL
  symbol: string | null;
}

export interface PriceData {
  usdPrice: number;
  symbol: string;
  updatedAt: number;
}

export interface DAppPermission {
  origin: string;
  publicKey: string;
  grantedAt: number;
  favicon?: string;
  name?: string;
}
