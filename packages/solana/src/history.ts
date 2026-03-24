import { Connection, PublicKey, ParsedTransactionWithMeta, ConfirmedSignatureInfo } from '@solana/web3.js';
import type { ParsedTransaction, TransactionType } from '@kibipay/shared-types';

const BATCH_SIZE = 10;

function classifyTransaction(
  tx: ParsedTransactionWithMeta,
  ownerAddress: string,
): { type: TransactionType; amount: string | null; counterparty: string | null } {
  const accountKeys = tx.transaction.message.accountKeys.map((k) =>
    typeof k === 'string' ? k : k.pubkey.toBase58(),
  );
  const isOwner = (addr: string) => addr === ownerAddress;
  const ownerIndex = accountKeys.findIndex(isOwner);

  if (ownerIndex === -1) return { type: 'unknown', amount: null, counterparty: null };

  const preBalance = tx.meta?.preBalances[ownerIndex] ?? 0;
  const postBalance = tx.meta?.postBalances[ownerIndex] ?? 0;
  const delta = postBalance - preBalance;

  if (Math.abs(delta) > 0) {
    const counterpartyIndex = delta > 0
      ? tx.meta?.postBalances.findIndex((b, i) => i !== ownerIndex && (tx.meta?.preBalances[i] ?? 0) - b > 0) ?? -1
      : tx.meta?.postBalances.findIndex((b, i) => i !== ownerIndex && b - (tx.meta?.preBalances[i] ?? 0) > 0) ?? -1;

    const counterparty = counterpartyIndex >= 0 ? accountKeys[counterpartyIndex] ?? null : null;
    return {
      type: delta > 0 ? 'receive' : 'send',
      amount: Math.abs(delta).toString(),
      counterparty,
    };
  }

  return { type: 'unknown', amount: null, counterparty: null };
}

export async function getTransactionHistory(
  connection: Connection,
  publicKey: PublicKey,
  limit = 20,
): Promise<ParsedTransaction[]> {
  let sigs: ConfirmedSignatureInfo[];
  try {
    sigs = await connection.getSignaturesForAddress(publicKey, { limit }, 'confirmed');
  } catch {
    return [];
  }

  if (sigs.length === 0) return [];

  const results: ParsedTransaction[] = [];

  // Fetch in batches to avoid rate limiting
  for (let i = 0; i < sigs.length; i += BATCH_SIZE) {
    const batch = sigs.slice(i, i + BATCH_SIZE);
    const txs = await connection.getParsedTransactions(
      batch.map((s) => s.signature),
      { commitment: 'confirmed', maxSupportedTransactionVersion: 0 },
    );

    for (let j = 0; j < batch.length; j++) {
      const sig = batch[j];
      const tx = txs[j];

      if (!sig) continue;

      if (!tx) {
        results.push({
          signature: sig.signature,
          slot: sig.slot,
          blockTime: sig.blockTime ?? null,
          type: 'unknown',
          amount: null,
          token: null,
          tokenSymbol: null,
          counterparty: null,
          fee: 0,
          status: sig.err ? 'failed' : 'confirmed',
        });
        continue;
      }

      const { type, amount, counterparty } = classifyTransaction(tx, publicKey.toBase58());

      results.push({
        signature: sig.signature,
        slot: sig.slot,
        blockTime: tx.blockTime ?? null,
        type,
        amount,
        token: null, // SOL by default; SPL detection requires deeper parsing
        tokenSymbol: amount ? 'SOL' : null,
        counterparty,
        fee: tx.meta?.fee ?? 0,
        status: tx.meta?.err ? 'failed' : 'confirmed',
      });
    }
  }

  return results;
}
