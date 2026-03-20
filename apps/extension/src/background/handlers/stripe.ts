import type { StripeSessionPayload, StripeSessionResponse } from '@kibipay/shared-types';
import { loadSettings } from '../vault.js';
import { isLocked, getActivePublicKey } from '../keyring.js';

export async function handleStripe(payload: unknown): Promise<StripeSessionResponse> {
  if (isLocked()) throw new Error('Wallet is locked');

  const { currency = 'sol', amount } = (payload as Partial<StripeSessionPayload>) ?? {};
  const walletAddress = getActivePublicKey()!;

  const settings = await loadSettings();
  const backendUrl = settings.backendUrl;

  const res = await fetch(`${backendUrl}/api/stripe/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress, currency, amount }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create Stripe session: ${err}`);
  }

  return res.json() as Promise<StripeSessionResponse>;
}
