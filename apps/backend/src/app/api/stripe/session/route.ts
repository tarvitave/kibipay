import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PublicKey } from '@solana/web3.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// Simple in-memory rate limiter (use Upstash Redis for production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const window = 60 * 60 * 1000; // 1 hour
  const limit = 10;

  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + window });
    return false;
  }
  if (entry.count >= limit) return true;
  entry.count++;
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  let body: { walletAddress?: string; currency?: string; amount?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { walletAddress, currency = 'sol', amount } = body;

  // Validate Solana address
  if (!walletAddress) {
    return NextResponse.json({ error: 'walletAddress is required' }, { status: 400 });
  }
  try {
    const pk = new PublicKey(walletAddress);
    if (!PublicKey.isOnCurve(pk.toBytes())) {
      throw new Error('Not on curve');
    }
  } catch {
    return NextResponse.json({ error: 'Invalid Solana wallet address' }, { status: 400 });
  }

  const cryptoCurrency = currency === 'usdc' ? 'USDC' : 'SOL';
  const network = cryptoCurrency === 'USDC' ? 'solana' : 'solana';

  try {
    const session = await stripe.crypto.onrampSessions.create({
      transaction_details: {
        destination_currency: cryptoCurrency.toLowerCase(),
        destination_network: network,
        wallet_address: walletAddress,
        ...(amount ? { destination_amount: String(amount) } : {}),
      },
      customer_ip_address: ip !== 'unknown' ? ip : undefined,
    } as Parameters<typeof stripe.crypto.onrampSessions.create>[0]);

    return NextResponse.json({
      clientSecret: session.client_secret,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
      sessionId: session.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe error';
    console.error('Stripe session creation failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
