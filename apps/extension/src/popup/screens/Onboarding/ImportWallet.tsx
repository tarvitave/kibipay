import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateMnemonic, normalizeAndValidate } from '@kibipay/crypto';
import BackButton from '../../components/BackButton.js';

export default function ImportWallet() {
  const navigate = useNavigate();
  const [phrase, setPhrase] = useState('');
  const [error, setError] = useState('');

  const normalized = phrase.trim().toLowerCase().replace(/\s+/g, ' ');
  const wordCount = normalized.split(' ').filter(Boolean).length;
  const valid = wordCount === 12 || wordCount === 24;
  const isValid = valid && validateMnemonic(normalized);

  const proceed = () => {
    try {
      const clean = normalizeAndValidate(phrase);
      sessionStorage.setItem('kibipay_pending_mnemonic', clean);
      navigate('/onboarding/set-password');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid phrase');
    }
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <BackButton />
        <div>
          <h2 className="font-bold text-white text-lg">Import Wallet</h2>
          <p className="text-white/50 text-xs">Enter your 12 or 24 word phrase</p>
        </div>
      </div>

      <div className="screen-body space-y-4">
        <div>
          <textarea
            className="input-field resize-none h-36 text-sm leading-relaxed"
            placeholder="Enter your recovery phrase, one word per space..."
            value={phrase}
            onChange={(e) => {
              setPhrase(e.target.value);
              setError('');
            }}
            autoFocus
            spellCheck={false}
          />
          <div className="flex justify-between mt-1.5">
            <span className={`text-xs ${error ? 'text-red-400' : 'text-white/40'}`}>
              {error || (wordCount > 0 ? `${wordCount} words` : '')}
            </span>
            {isValid && (
              <span className="text-xs text-green-400">✓ Valid phrase</span>
            )}
          </div>
        </div>

        <div className="card">
          <p className="text-white/60 text-xs">
            Your phrase is encrypted locally and never leaves your device.
          </p>
        </div>

        <button
          className="btn-primary"
          disabled={!isValid}
          onClick={proceed}
        >
          Import Wallet
        </button>
      </div>
    </div>
  );
}
