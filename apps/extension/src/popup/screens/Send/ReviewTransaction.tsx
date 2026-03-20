import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Check } from 'lucide-react';
import { PublicKey } from '@solana/web3.js';
import { useMessaging } from '../../hooks/useMessaging.js';
import { useWalletState } from '../../hooks/useWallet.js';
import AddressDisplay from '../../components/AddressDisplay.js';
import BackButton from '../../components/BackButton.js';
import type { SimulationResult } from '@kibipay/shared-types';

export default function ReviewTransaction() {
  const navigate = useNavigate();
  const { sendMessage } = useMessaging();
  const { state } = useWalletState();

  const params = JSON.parse(sessionStorage.getItem('kibipay_send_params') ?? '{}');
  const { to, amount, token } = params as { to: string; amount: string; token: { mint?: string; symbol: string; decimals: number } };

  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [simLoading, setSimLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txSig, setTxSig] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // For simulation, we'd need to build the transaction first
    // For now, show a fee estimate
    setTimeout(() => {
      setSimulation({
        fee: 5000,
        balanceChanges: [],
        logs: [],
        error: null,
        unitsConsumed: 200_000,
      });
      setSimLoading(false);
    }, 500);
  }, []);

  const confirm = async () => {
    setSending(true);
    setError('');
    try {
      const isSOL = !token.mint;

      if (isSOL) {
        const lamports = BigInt(Math.round(Number(amount) * 1e9));
        // Build + sign + send via background
        const result = await sendMessage<{ signature: string }>('SOL_SIGN_AND_SEND', {
          to,
          lamports: lamports.toString(),
        });
        setTxSig(result.signature);
      } else {
        const tokenAmount = BigInt(Math.round(Number(amount) * 10 ** token.decimals));
        const result = await sendMessage<{ signature: string }>('SOL_SIGN_AND_SEND', {
          to,
          mint: token.mint,
          tokenAmount: tokenAmount.toString(),
          decimals: token.decimals,
        });
        setTxSig(result.signature);
      }
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transaction failed');
    } finally {
      setSending(false);
    }
  };

  if (success) {
    return (
      <div className="screen items-center justify-center px-6 text-center space-y-6">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
          <Check size={32} className="text-green-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Sent!</h2>
          <p className="text-white/50 text-sm mt-1">
            {amount} {token.symbol} sent successfully
          </p>
        </div>
        {txSig && (
          <p className="text-white/30 font-mono text-xs break-all">{txSig.slice(0, 20)}...</p>
        )}
        <button className="btn-primary" onClick={() => navigate('/dashboard', { replace: true })}>
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <BackButton />
        <h2 className="font-bold text-white text-lg">Review</h2>
      </div>

      <div className="screen-body space-y-4">
        {/* Summary */}
        <div className="card space-y-3">
          <div className="flex justify-between">
            <span className="text-white/50 text-sm">Amount</span>
            <span className="text-white font-medium">{amount} {token.symbol}</span>
          </div>
          <div className="border-t border-white/10" />
          <div className="flex justify-between">
            <span className="text-white/50 text-sm">To</span>
            <AddressDisplay address={to} chars={6} showCopy />
          </div>
          <div className="border-t border-white/10" />
          <div className="flex justify-between">
            <span className="text-white/50 text-sm">Network fee</span>
            {simLoading ? (
              <div className="w-16 h-4 bg-white/10 rounded animate-pulse" />
            ) : (
              <span className="text-white text-sm">~{((simulation?.fee ?? 5000) / 1e9).toFixed(6)} SOL</span>
            )}
          </div>
        </div>

        {simulation?.error && (
          <div className="flex items-start gap-2 p-3 bg-red-500/20 rounded-xl border border-red-500/30">
            <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{simulation.error}</p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-500/20 rounded-xl border border-red-500/30">
            <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <button
          className="btn-primary"
          disabled={sending}
          onClick={confirm}
        >
          {sending ? 'Sending...' : 'Confirm & Send'}
        </button>
      </div>
    </div>
  );
}
