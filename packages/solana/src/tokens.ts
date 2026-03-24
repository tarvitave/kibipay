import { Connection, PublicKey } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import type { TokenAccount } from '@kibipay/shared-types';

interface JupiterToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

const JUPITER_TOKEN_LIST_URL = 'https://token.jup.ag/strict';

let tokenListCache: Map<string, JupiterToken> | null = null;
let tokenListFetchedAt = 0;
const TOKEN_LIST_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function getTokenList(): Promise<Map<string, JupiterToken>> {
  const now = Date.now();
  if (tokenListCache && now - tokenListFetchedAt < TOKEN_LIST_TTL_MS) {
    return tokenListCache;
  }

  try {
    const res = await fetch(JUPITER_TOKEN_LIST_URL);
    const tokens: JupiterToken[] = await res.json();
    tokenListCache = new Map(tokens.map((t) => [t.address, t]));
    tokenListFetchedAt = now;
    return tokenListCache;
  } catch {
    return tokenListCache ?? new Map();
  }
}

export async function enrichTokenAccounts(accounts: TokenAccount[]): Promise<TokenAccount[]> {
  const tokenList = await getTokenList();
  return accounts.map((account) => {
    const meta = tokenList.get(account.mint);
    if (!meta) return account;
    return {
      ...account,
      symbol: meta.symbol,
      name: meta.name,
      logoURI: meta.logoURI ?? null,
      decimals: meta.decimals,
    };
  });
}

export async function getAssociatedTokenAccount(
  owner: PublicKey,
  mint: PublicKey,
): Promise<PublicKey> {
  return getAssociatedTokenAddress(mint, owner, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
}

export async function tokenAccountExists(
  connection: Connection,
  ata: PublicKey,
): Promise<boolean> {
  const info = await connection.getAccountInfo(ata);
  return info !== null;
}
