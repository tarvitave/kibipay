import { useSearchParams } from 'react-router-dom';
import { Shield, AlertTriangle } from 'lucide-react';
import { useMessaging } from '../../hooks/useMessaging.js';

export default function ConnectPrompt() {
  const [params] = useSearchParams();
  const { sendMessage } = useMessaging();

  const origin = params.get('origin') ?? 'Unknown';
  const requestId = params.get('requestId') ?? '';
  const suspicious = params.get('suspicious') === 'true';

  const approve = async () => {
    await sendMessage('DAPP_APPROVE_CONNECTION', { requestId });
    window.close();
  };

  const reject = async () => {
    await sendMessage('DAPP_REJECT_CONNECTION', { requestId, reason: 'User rejected' });
    window.close();
  };

  return (
    <div className="screen items-center px-6 pt-8 pb-6">
      <div className="w-full space-y-6">
        {suspicious && (
          <div className="flex items-start gap-3 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
            <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 font-semibold text-sm">Suspicious Site</p>
              <p className="text-red-400/80 text-xs mt-1">
                This site resembles a known legitimate site but may be a phishing attempt.
              </p>
            </div>
          </div>
        )}

        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-brand-500/20 rounded-full flex items-center justify-center mx-auto">
            <Shield size={28} className="text-brand-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Connect Wallet</h2>
            <p className="text-white/50 text-sm mt-1 break-all">{origin}</p>
          </div>
          <p className="text-white/60 text-sm">
            This site is requesting access to your wallet address.
          </p>
        </div>

        <div className="card space-y-2">
          <p className="text-white/50 text-xs font-medium uppercase tracking-wider">Permissions</p>
          <p className="text-white/80 text-sm">✓ View wallet address</p>
          <p className="text-white/80 text-sm">✓ Request transaction signing</p>
        </div>

        <div className="space-y-3">
          <button className="btn-primary" onClick={approve}>Connect</button>
          <button className="btn-secondary" onClick={reject}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
