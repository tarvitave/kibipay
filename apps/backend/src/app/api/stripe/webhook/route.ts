import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// Must disable Next.js body parser for webhook signature verification
export const config = {
  api: { bodyParser: false },
};

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook signature verification failed';
    console.error('Webhook error:', message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case 'crypto.onramp_session.updated': {
      const session = event.data.object as {
        id: string;
        status: string;
        wallet_address?: { address: string; crypto_currency: string };
      };
      console.log(`OnRamp session ${session.id} updated to status: ${session.status}`);
      if (session.status === 'fulfillment_complete') {
        console.log(`Crypto delivered to ${session.wallet_address?.address}`);
        // TODO: send push notification to user, update analytics, etc.
      }
      break;
    }
    default:
      // Ignore other event types
      break;
  }

  return NextResponse.json({ received: true });
}
