import { useState, useEffect, useRef } from 'react';
import BackButton from '../../components/BackButton.js';
import { useMessaging } from '../../hooks/useMessaging.js';
import type { StripeSessionResponse } from '@kibipay/shared-types';

export default function Onramp() {
  const { sendMessage } = useMessaging();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    const initStripe = async () => {
      try {
        const session = await sendMessage<StripeSessionResponse>('STRIPE_GET_SESSION');

        if (!mounted) return;

        // Dynamically import Stripe on-ramp to avoid bundling issues
        const { loadStripeOnramp } = await import('@stripe/crypto');
        const stripeOnramp = await loadStripeOnramp(session.publishableKey);

        if (!containerRef.current || !mounted) return;
        if (!stripeOnramp) throw new Error('Failed to load Stripe on-ramp');

        const onrampSession = stripeOnramp.createSession({
          clientSecret: session.clientSecret,
          appearance: {
            theme: 'dark',
          },
        });

        onrampSession.mount(containerRef.current);

        onrampSession.addEventListener('onramp_session_updated', (e: unknown) => {
          const event = e as { payload: { session: { status: string } } };
          if (event.payload?.session?.status === 'fulfillment_complete') {
            // Balance will refresh automatically on next poll
          }
        });

        setLoading(false);
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : 'Failed to load on-ramp');
          setLoading(false);
        }
      }
    };

    initStripe();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="screen">
      <div className="screen-header">
        <BackButton />
        <div>
          <h2 className="font-bold text-white text-lg">Buy Crypto</h2>
          <p className="text-white/50 text-xs">Powered by Stripe</p>
        </div>
      </div>

      <div className="screen-body flex flex-col">
        {loading && !error && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-white/50 text-sm">Loading payment...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="text-center space-y-4">
              <p className="text-red-400 text-sm">{error}</p>
              <p className="text-white/40 text-xs">
                Stripe on-ramp requires a backend API. Make sure{' '}
                <code className="text-brand-300">apps/backend</code> is deployed and configured
                in Settings → Backend URL.
              </p>
            </div>
          </div>
        )}

        <div
          ref={containerRef}
          className={`flex-1 ${loading || error ? 'hidden' : ''}`}
        />
      </div>
    </div>
  );
}
