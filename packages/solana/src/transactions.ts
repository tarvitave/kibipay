import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
  VersionedTransaction,
} from '@solana/web3.js';
import {
  createTransferCheckedInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { tokenAccountExists } from './tokens.js';

export async function buildTransferSol(
  connection: Connection,
  from: PublicKey,
  to: PublicKey,
  lamports: bigint,
): Promise<Transaction> {
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  const tx = new Transaction();
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;
  tx.feePayer = from;
  tx.add(
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: to,
      lamports: Number(lamports),
    }),
  );
  return tx;
}

export async function buildTransferSpl(
  connection: Connection,
  from: PublicKey,
  to: PublicKey,
  mint: PublicKey,
  amount: bigint,
  decimals: number,
): Promise<Transaction> {
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  const tx = new Transaction();
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;
  tx.feePayer = from;

  const fromAta = await getAssociatedTokenAddress(mint, from);
  const toAta = await getAssociatedTokenAddress(mint, to);

  // Create recipient ATA if it doesn't exist
  const ataExists = await tokenAccountExists(connection, toAta);
  if (!ataExists) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        from,  // payer
        toAta,
        to,
        mint,
      ),
    );
  }

  tx.add(
    createTransferCheckedInstruction(
      fromAta,
      mint,
      toAta,
      from,
      amount,
      decimals,
      [],
      TOKEN_PROGRAM_ID,
    ),
  );

  return tx;
}

export function signTransaction(transaction: Transaction, keypair: Keypair): Transaction {
  transaction.sign(keypair);
  return transaction;
}

export async function sendTransaction(
  connection: Connection,
  signedTransaction: Transaction | VersionedTransaction,
): Promise<string> {
  const raw = signedTransaction.serialize();
  const signature = await connection.sendRawTransaction(raw, {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
    maxRetries: 3,
  });
  return signature;
}

export async function confirmTransaction(
  connection: Connection,
  signature: string,
): Promise<boolean> {
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  const result = await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    'confirmed',
  );
  return !result.value.err;
}

export function serializeTransaction(tx: Transaction | VersionedTransaction): string {
  const bytes = tx instanceof VersionedTransaction
    ? tx.serialize()
    : tx.serialize({ requireAllSignatures: false });
  return Buffer.from(bytes).toString('base64');
}

export function deserializeTransaction(serialized: string): Transaction {
  return Transaction.from(Buffer.from(serialized, 'base64'));
}

export function deserializeVersionedTransaction(serialized: string): VersionedTransaction {
  return VersionedTransaction.deserialize(Buffer.from(serialized, 'base64'));
}
