import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import type { MessageType, SolTransferPayload, SolSimulatePayload, SolSignAndSendPayload } from '@kibipay/shared-types';
import {
  getConnection,
  getSolBalance,
  getTokenAccounts,
  enrichTokenAccounts,
  buildTransferSol,
  buildTransferSpl,
  signTransaction,
  sendTransaction,
  simulateTransaction,
  getTransactionHistory,
  serializeTransaction,
  deserializeTransaction,
  deserializeVersionedTransaction,
} from '@kibipay/solana';
import { isValidPublicKey } from '@kibipay/crypto';
import { isLocked, getActivePublicKey, getKeypair } from '../keyring.js';
import { loadSettings } from '../vault.js';

async function getConn() {
  const settings = await loadSettings();
  return getConnection(settings.network, settings.rpcEndpoint);
}

export async function handleSolana(type: MessageType, payload: unknown): Promise<unknown> {
  if (isLocked()) throw new Error('Wallet is locked');

  const activePublicKey = getActivePublicKey()!;
  const connection = await getConn();
  const pubkey = new PublicKey(activePublicKey);

  switch (type) {
    case 'SOL_GET_BALANCE': {
      const balance = await getSolBalance(connection, pubkey);
      return { balance: balance.toString(), publicKey: activePublicKey };
    }

    case 'SOL_GET_TOKENS': {
      const raw = await getTokenAccounts(connection, pubkey);
      const enriched = await enrichTokenAccounts(raw);
      return { tokens: enriched };
    }

    case 'SOL_GET_HISTORY': {
      const { limit } = (payload as { limit?: number }) ?? {};
      const history = await getTransactionHistory(connection, pubkey, limit ?? 20);
      return { history };
    }

    case 'SOL_SIMULATE': {
      const { serializedTransaction } = payload as SolSimulatePayload;
      let tx: Transaction | VersionedTransaction;
      try {
        tx = deserializeVersionedTransaction(serializedTransaction);
      } catch {
        tx = deserializeTransaction(serializedTransaction);
      }
      const result = await simulateTransaction(connection, tx, [pubkey]);
      return result;
    }

    case 'SOL_SIGN_TRANSACTION': {
      const { serializedTransaction } = payload as SolSimulatePayload;
      const tx = deserializeTransaction(serializedTransaction);
      const keypair = getKeypair(activePublicKey);
      const signed = signTransaction(tx, keypair);
      return { serializedTransaction: serializeTransaction(signed) };
    }

    case 'SOL_SIGN_AND_SEND': {
      const { serializedTransaction } = payload as SolSignAndSendPayload;
      const tx = deserializeTransaction(serializedTransaction);
      const keypair = getKeypair(activePublicKey);
      const signed = signTransaction(tx, keypair);
      const signature = await sendTransaction(connection, signed);
      return { signature };
    }

    default:
      throw new Error(`Unhandled solana message type: ${type}`);
  }
}
