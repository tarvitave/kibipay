import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useWalletActions } from '../hooks/useWallet.js';

export default function Unlock() {
  const navigate = useNavigate();
  const { unlock } = useWalletActions();
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const submit = async () => {
    if (!password || loading) return;
    setLoading(true);
    setError('');
    try {
      await unlock(password);
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Incorrect password');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen items-center justify-center px-6">
      <div className="w-full space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">💎</div>
          <h1 className="text-xl font-bold text-white">Welcome back</h1>
          <p className="text-white/50 text-sm mt-1">Enter your password to unlock</p>
        </div>

        <div className={`space-y-3 ${shake ? 'animate-bounce' : ''}`}>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              className={`input-field pr-12 ${error ? 'border-red-500' : ''}`}
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
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
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>

        <button
          className="btn-primary"
          onClick={submit}
          disabled={!password || loading}
        >
          {loading ? 'Unlocking...' : 'Unlock'}
        </button>

        <button
          onClick={() => navigate('/onboarding/import')}
          className="w-full text-center text-white/30 hover:text-white/60 text-xs transition-colors"
        >
          Forgot password? Import with recovery phrase
        </button>
      </div>
    </div>
  );
}
