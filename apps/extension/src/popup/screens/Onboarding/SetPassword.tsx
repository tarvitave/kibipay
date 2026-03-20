import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useWalletActions } from '../../hooks/useWallet.js';
import BackButton from '../../components/BackButton.js';

export default function SetPassword() {
  const navigate = useNavigate();
  const { createWallet } = useWalletActions();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const mnemonic = sessionStorage.getItem('kibipay_pending_mnemonic') ?? '';

  const strength =
    password.length === 0 ? null
    : password.length < 8 ? 'weak'
    : password.length < 12 ? 'moderate'
    : 'strong';

  const canSubmit = password.length >= 8 && password === confirm;

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      await createWallet(password, mnemonic);
      sessionStorage.removeItem('kibipay_pending_mnemonic');
      navigate('/dashboard', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <BackButton />
        <div>
          <h2 className="font-bold text-white text-lg">Create Password</h2>
          <p className="text-white/50 text-xs">Used to unlock your wallet</p>
        </div>
      </div>

      <div className="screen-body space-y-4">
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'}
            className="input-field pr-12"
            placeholder="Password (min. 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80"
          >
            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {strength && (
          <div className="flex gap-1">
            {['weak', 'moderate', 'strong'].map((level, i) => (
              <div
                key={level}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  ['weak', 'moderate', 'strong'].indexOf(strength) >= i
                    ? level === 'weak'
                      ? 'bg-red-400'
                      : level === 'moderate'
                      ? 'bg-yellow-400'
                      : 'bg-green-400'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        )}

        <input
          type={showPw ? 'text' : 'password'}
          className="input-field"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && canSubmit && submit()}
        />

        {confirm && password !== confirm && (
          <p className="text-red-400 text-xs">Passwords do not match</p>
        )}

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <button
          className="btn-primary"
          disabled={!canSubmit || loading}
          onClick={submit}
        >
          {loading ? 'Creating wallet...' : 'Create Wallet'}
        </button>
      </div>
    </div>
  );
}
