import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  TOKEN_PROGRAM_ID,
} from '@solana/web3.js';
import type { TokenAccount } from '@kibipay/shared-types';

export async function getSolBalance(connection: Connection, publicKey: PublicKey): Promise<bigint> {
  const lamports = await connection.getBalance(publicKey, 'confirmed');
  return BigInt(lamports);
}

export function lamportsToSol(lamports: bigint): number {
  return Number(lamports) / LAMPORTS_PER_SOL;
}

export function solToLamports(sol: number): bigint {
  return BigInt(Math.round(sol * LAMPORTS_PER_SOL));
}

export function formatSol(lamports: bigint, decimals = 4): string {
  const sol = lamportsToSol(lamports);
  return sol.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export async function getTokenAccounts(
  connection: Connection,
  publicKey: PublicKey,
): Promise<TokenAccount[]> {
  const result = await connection.getParsedTokenAccountsByOwner(
    publicKey,
    { programId: TOKEN_PROGRAM_ID },
    'confirmed',
  );

  const accounts: TokenAccount[] = [];

  for (const { pubkey, account } of result.value) {
    const parsed = account.data.parsed?.info;
    if (!parsed) continue;

    const { mint, tokenAmount } = parsed;
    if (!tokenAmount || tokenAmount.uiAmount === 0) continue;

    accounts.push({
      mint: mint as string,
      ata: pubkey.toBase58(),
      balance: tokenAmount.amount as string,
      decimals: tokenAmount.decimals as number,
      symbol: 'Unknown',
      name: 'Unknown Token',
      logoURI: null,
      uiAmount: tokenAmount.uiAmount as number,
    });
  }

  return accounts;
}
