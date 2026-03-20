import { useSearchParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useMessaging } from '../../hooks/useMessaging.js';

export default function SignPrompt() {
  const [params] = useSearchParams();
  const { sendMessage } = useMessaging();

  const origin = params.get('origin') ?? 'Unknown';
  const requestId = params.get('requestId') ?? '';
  const action = params.get('action') ?? 'sign';

  const approve = async () => {
    await sendMessage('DAPP_APPROVE_TRANSACTION', { requestId });
    window.close();
  };

  const reject = async () => {
    await sendMessage('DAPP_REJECT_TRANSACTION', { requestId, reason: 'User rejected' });
    window.close();
  };

  return (
    <div className="screen px-6 pt-8 pb-6">
      <div className="w-full space-y-5">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-white">
            {action === 'send' ? 'Sign & Send' : 'Sign Transaction'}
          </h2>
          <p className="text-white/50 text-sm break-all">{origin}</p>
        </div>

        <div className="card">
          <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2">Request</p>
          <p className="text-white/80 text-sm">
            {action === 'send'
              ? 'Approve and send this transaction to the Solana network.'
              : 'Sign this transaction. It will not be sent automatically.'}
          </p>
        </div>

        <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
          <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-yellow-300/80 text-xs">
            Only approve transactions from sites you trust. This cannot be undone.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <button className="btn-primary" onClick={approve}>
            {action === 'send' ? 'Approve & Send' : 'Sign'}
          </button>
          <button className="btn-secondary" onClick={reject}>Reject</button>
        </div>
      </div>
    </div>
  );
}
