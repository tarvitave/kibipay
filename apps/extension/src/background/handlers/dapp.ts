import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import nacl from 'tweetnacl';
import type {
  MessageType,
  DAppConnectPayload,
  DAppSignTransactionPayload,
  DAppSignAllTransactionsPayload,
  DAppSignMessagePayload,
  DAppApprovePayload,
  DAppRejectPayload,
} from '@kibipay/shared-types';
import {
  isLocked,
  getActivePublicKey,
  getActiveKeypair,
} from '../keyring.js';
import {
  hasPermission,
  grantPermission,
  revokePermission,
  listPermissions,
  getPermission,
} from '../permissions.js';
import {
  deserializeTransaction,
  deserializeVersionedTransaction,
  serializeTransaction,
} from '@kibipay/solana';

// ── Pending request queue ────────────────────────────────────────────────────

interface PendingRequest {
  type: 'connect' | 'sign' | 'signAll' | 'signMessage';
  resolve: (value: unknown) => void;
  reject: (reason: string) => void;
  timeoutId: ReturnType<typeof setTimeout>;
  data: unknown;
}

const pendingRequests = new Map<string, PendingRequest>();
const REQUEST_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

function createPendingRequest(
  requestId: string,
  type: PendingRequest['type'],
  data: unknown,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject('Request timed out');
    }, REQUEST_TIMEOUT_MS);

    pendingRequests.set(requestId, { type, resolve, reject, timeoutId, data });
  });
}

// ── Phishing detection ───────────────────────────────────────────────────────

const KNOWN_SAFE_ORIGINS = new Set([
  'https://jup.ag',
  'https://app.uniswap.org',
  'https://raydium.io',
  'https://www.orca.so',
  'https://magiceden.io',
  'https://phantom.app',
]);

function isSuspiciousOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    const host = url.hostname;
    for (const safe of KNOWN_SAFE_ORIGINS) {
      const safeHost = new URL(safe).hostname;
      if (host !== safeHost && levenshtein(host, safeHost) <= 2) return true;
    }
  } catch {
    // ignore
  }
  return false;
}

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

// ── Approval popup ───────────────────────────────────────────────────────────

function openApprovalPopup(route: string): void {
  const url = chrome.runtime.getURL(`src/popup/index.html#${route}`);
  chrome.windows.create({
    url,
    type: 'popup',
    width: 360,
    height: 600,
    focused: true,
  });
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function handleDApp(type: MessageType, payload: unknown): Promise<unknown> {
  switch (type) {
    case 'DAPP_CONNECT': {
      const { origin, favicon, name } = payload as DAppConnectPayload;

      if (isLocked()) {
        // Open popup to unlock, then connect
        openApprovalPopup(`/dapp/connect?origin=${encodeURIComponent(origin)}&requireUnlock=true`);
        throw new Error('Wallet is locked. Please unlock first.');
      }

      const activePublicKey = getActivePublicKey()!;

      // Already permitted
      if (await hasPermission(origin)) {
        return { publicKey: activePublicKey, connected: true };
      }

      const suspicious = isSuspiciousOrigin(origin);
      const requestId = crypto.randomUUID();

      openApprovalPopup(
        `/dapp/connect?origin=${encodeURIComponent(origin)}&requestId=${requestId}&suspicious=${suspicious}`,
      );

      const result = await createPendingRequest(requestId, 'connect', { origin, favicon, name, activePublicKey });
      return result;
    }

    case 'DAPP_APPROVE_CONNECTION': {
      const { requestId } = payload as DAppApprovePayload;
      const pending = pendingRequests.get(requestId);
      if (!pending) throw new Error('No pending connection request');

      const { origin, favicon, name, activePublicKey } = pending.data as {
        origin: string;
        favicon?: string;
        name?: string;
        activePublicKey: string;
      };

      clearTimeout(pending.timeoutId);
      pendingRequests.delete(requestId);

      await grantPermission(origin, activePublicKey, { favicon, name });
      pending.resolve({ publicKey: activePublicKey, connected: true });
      return { success: true };
    }

    case 'DAPP_REJECT_CONNECTION': {
      const { requestId, reason } = payload as DAppRejectPayload;
      const pending = pendingRequests.get(requestId);
      if (!pending) throw new Error('No pending connection request');

      clearTimeout(pending.timeoutId);
      pendingRequests.delete(requestId);
      pending.reject(reason ?? 'User rejected connection');
      return { success: true };
    }

    case 'DAPP_DISCONNECT': {
      const { origin } = payload as { origin: string };
      await revokePermission(origin);
      return { disconnected: true };
    }

    case 'DAPP_GET_PERMISSIONS': {
      const permissions = await listPermissions();
      return { permissions };
    }

    case 'DAPP_REVOKE_PERMISSION': {
      const { origin } = payload as { origin: string };
      await revokePermission(origin);
      return { success: true };
    }

    case 'DAPP_SIGN_TRANSACTION':
    case 'DAPP_SIGN_AND_SEND_TRANSACTION': {
      const { origin, serializedTransaction, requestId } = payload as DAppSignTransactionPayload;

      if (isLocked()) throw new Error('Wallet is locked');
      if (!(await hasPermission(origin))) throw new Error('Not connected to this dApp');

      openApprovalPopup(
        `/dapp/sign?requestId=${requestId}&origin=${encodeURIComponent(origin)}&action=${type === 'DAPP_SIGN_AND_SEND_TRANSACTION' ? 'send' : 'sign'}`,
      );

      const result = await createPendingRequest(requestId, 'sign', {
        origin,
        serializedTransaction,
        action: type,
      });
      return result;
    }

    case 'DAPP_APPROVE_TRANSACTION': {
      const { requestId } = payload as DAppApprovePayload;
      const pending = pendingRequests.get(requestId);
      if (!pending) throw new Error('No pending transaction request');

      clearTimeout(pending.timeoutId);
      pendingRequests.delete(requestId);

      const { serializedTransaction, action } = pending.data as {
        serializedTransaction: string;
        action: MessageType;
      };

      let tx: Transaction | VersionedTransaction;
      try {
        tx = deserializeVersionedTransaction(serializedTransaction);
      } catch {
        tx = deserializeTransaction(serializedTransaction);
      }

      const keypair = getActiveKeypair();

      if (action === 'DAPP_SIGN_AND_SEND_TRANSACTION') {
        const { getConnection } = await import('@kibipay/solana');
        const { loadSettings } = await import('../vault.js');
        const settings = await loadSettings();
        const connection = getConnection(settings.network, settings.rpcEndpoint);

        if (tx instanceof Transaction) {
          tx.sign(keypair);
          const { sendTransaction } = await import('@kibipay/solana');
          const signature = await sendTransaction(connection, tx);
          pending.resolve({ signature });
        }
      } else {
        // Sign only
        if (tx instanceof Transaction) {
          tx.sign(keypair);
        }
        const { serializeTransaction } = await import('@kibipay/solana');
        pending.resolve({ serializedTransaction: serializeTransaction(tx) });
      }

      return { success: true };
    }

    case 'DAPP_REJECT_TRANSACTION': {
      const { requestId, reason } = payload as DAppRejectPayload;
      const pending = pendingRequests.get(requestId);
      if (!pending) throw new Error('No pending transaction request');

      clearTimeout(pending.timeoutId);
      pendingRequests.delete(requestId);
      pending.reject(reason ?? 'User rejected transaction');
      return { success: true };
    }

    case 'DAPP_SIGN_MESSAGE': {
      const { origin, message, requestId } = payload as DAppSignMessagePayload;

      if (isLocked()) throw new Error('Wallet is locked');
      if (!(await hasPermission(origin))) throw new Error('Not connected to this dApp');

      openApprovalPopup(
        `/dapp/sign-message?requestId=${requestId}&origin=${encodeURIComponent(origin)}`,
      );

      const result = await createPendingRequest(requestId, 'signMessage', { origin, message });
      return result;
    }

    case 'DAPP_APPROVE_SIGN_MESSAGE': {
      const { requestId } = payload as DAppApprovePayload;
      const pending = pendingRequests.get(requestId);
      if (!pending) throw new Error('No pending sign message request');

      clearTimeout(pending.timeoutId);
      pendingRequests.delete(requestId);

      const { message } = pending.data as { message: string };
      const messageBytes = Buffer.from(message, 'base64');
      const keypair = getActiveKeypair();
      const signature = nacl.sign.detached(messageBytes, keypair.secretKey);

      pending.resolve({
        signature: Buffer.from(signature).toString('base64'),
        publicKey: keypair.publicKey.toBase58(),
      });
      return { success: true };
    }

    case 'DAPP_REJECT_SIGN_MESSAGE': {
      const { requestId, reason } = payload as DAppRejectPayload;
      const pending = pendingRequests.get(requestId);
      if (!pending) throw new Error('No pending sign message request');

      clearTimeout(pending.timeoutId);
      pendingRequests.delete(requestId);
      pending.reject(reason ?? 'User rejected');
      return { success: true };
    }

    default:
      throw new Error(`Unhandled dApp message type: ${type}`);
  }
}
