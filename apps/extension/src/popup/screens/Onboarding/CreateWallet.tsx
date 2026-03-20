import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { generateMnemonic } from '@kibipay/crypto';
import BackButton from '../../components/BackButton.js';

export default function CreateWallet() {
  const navigate = useNavigate();
  const [mnemonic, setMnemonic] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    setMnemonic(generateMnemonic(128));
  }, []);

  const words = mnemonic.split(' ').filter(Boolean);

  const proceed = () => {
    sessionStorage.setItem('kibipay_pending_mnemonic', mnemonic);
    navigate('/onboarding/confirm');
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <BackButton />
        <div>
          <h2 className="font-bold text-white text-lg">Save Recovery Phrase</h2>
          <p className="text-white/50 text-xs">Write these 12 words down safely</p>
        </div>
      </div>

      <div className="screen-body space-y-4">
        <div className="card relative">
          <div className={`grid grid-cols-3 gap-2 ${!revealed ? 'blur-sm select-none' : ''}`}>
            {words.map((word, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2 py-1.5"
              >
                <span className="text-white/30 text-xs w-4">{i + 1}.</span>
                <span className="text-white text-sm font-medium">{word}</span>
              </div>
            ))}
          </div>
          {!revealed && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={() => setRevealed(true)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-white text-sm font-medium transition-colors"
              >
                <Eye size={16} />
                Reveal phrase
              </button>
            </div>
          )}
        </div>

        {revealed && (
          <button
            onClick={() => setMnemonic(generateMnemonic(128))}
            className="flex items-center gap-2 text-white/50 hover:text-white/80 text-sm transition-colors mx-auto"
          >
            <RefreshCw size={14} />
            Generate new phrase
          </button>
        )}

        <div className="card">
          <p className="text-yellow-400 text-xs font-medium mb-2">⚠️ Important</p>
          <ul className="text-white/60 text-xs space-y-1">
            <li>• Never share your recovery phrase with anyone</li>
            <li>• KibiPay will never ask for your phrase</li>
            <li>• Without this phrase, you cannot recover your wallet</li>
          </ul>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-brand-500"
          />
          <span className="text-white/70 text-sm">
            I have saved my recovery phrase in a safe place
          </span>
        </label>

        <button
          className="btn-primary"
          disabled={!confirmed || !revealed}
          onClick={proceed}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
