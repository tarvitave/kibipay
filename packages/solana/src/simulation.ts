import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import type { SimulationResult, BalanceChange } from '@kibipay/shared-types';

const KNOWN_ERRORS: Record<string, string> = {
  '0x1': 'Insufficient funds',
  '0x11': 'Insufficient funds for rent',
  InsufficientFundsForFee: 'Insufficient SOL to pay transaction fee',
  '0x26': 'Token balance insufficient',
};

function parseErrorMessage(logs: string[] | null): string | null {
  if (!logs) return null;
  for (const log of logs) {
    for (const [code, msg] of Object.entries(KNOWN_ERRORS)) {
      if (log.includes(code)) return msg;
    }
    if (log.includes('Error')) {
      const match = log.match(/Error: (.+)/);
      if (match) return match[1];
    }
  }
  return null;
}

export async function simulateTransaction(
  connection: Connection,
  transaction: Transaction | VersionedTransaction,
  _signerPublicKeys: PublicKey[],
): Promise<SimulationResult> {
  let result;

  if (transaction instanceof VersionedTransaction) {
    result = await connection.simulateTransaction(transaction, {
      commitment: 'confirmed',
      replaceRecentBlockhash: true,
    });
  } else {
    // Legacy Transaction overload: simulateTransaction(tx, signers?, includeAccounts?)
    result = await connection.simulateTransaction(transaction, undefined);
  }

  const { err, logs, accounts, unitsConsumed } = result.value;
  const errorMsg = err ? (parseErrorMessage(logs ?? []) ?? JSON.stringify(err)) : null;

  const balanceChanges: BalanceChange[] = [];
  // Full balance change parsing requires pre/post account snapshots;
  // accounts array from simulation only shows requested accounts.

  const feeEstimate = unitsConsumed ? Math.ceil((unitsConsumed / 1_000_000) * 5000) : 5000;

  return {
    fee: feeEstimate,
    balanceChanges,
    logs: logs ?? [],
    error: errorMsg,
    unitsConsumed: unitsConsumed ?? null,
  };
}
