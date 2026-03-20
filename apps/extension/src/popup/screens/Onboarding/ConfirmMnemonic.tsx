import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import BackButton from '../../components/BackButton.js';

export default function ConfirmMnemonic() {
  const navigate = useNavigate();
  const mnemonic = sessionStorage.getItem('kibipay_pending_mnemonic') ?? '';
  const correctWords = mnemonic.split(' ').filter(Boolean);

  const [selected, setSelected] = useState<string[]>(Array(12).fill(''));
  const [activeSlot, setActiveSlot] = useState(0);

  const wordBank = useMemo(() => {
    return [...correctWords].sort(() => Math.random() - 0.5);
  }, [mnemonic]);

  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());

  const pickWord = (word: string) => {
    if (activeSlot >= 12 || usedWords.has(word)) return;
    const next = [...selected];
    next[activeSlot] = word;
    setSelected(next);
    setUsedWords((prev) => new Set([...prev, word]));
    setActiveSlot((prev) => Math.min(prev + 1, 11));
  };

  const clearSlot = (index: number) => {
    const word = selected[index];
    if (!word) return;
    const next = [...selected];
    next[index] = '';
    setSelected(next);
    setUsedWords((prev) => {
      const s = new Set(prev);
      s.delete(word);
      return s;
    });
    setActiveSlot(index);
  };

  const isComplete = selected.every(Boolean);
  const isCorrect = selected.join(' ') === correctWords.join(' ');

  const confirm = () => {
    if (!isCorrect) return;
    navigate('/onboarding/set-password');
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <BackButton />
        <div>
          <h2 className="font-bold text-white text-lg">Confirm Phrase</h2>
          <p className="text-white/50 text-xs">Select words in the correct order</p>
        </div>
      </div>

      <div className="screen-body space-y-4">
        {/* Slots */}
        <div className="grid grid-cols-3 gap-2">
          {selected.map((word, i) => (
            <button
              key={i}
              onClick={() => clearSlot(i)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm border transition-colors ${
                i === activeSlot
                  ? 'border-brand-400 bg-brand-500/10'
                  : word
                  ? 'border-white/20 bg-white/5 text-white'
                  : 'border-white/10 bg-transparent text-white/20'
              }`}
            >
              <span className="text-white/30 text-xs w-4">{i + 1}.</span>
              <span className="flex-1 text-left truncate">{word || '...'}</span>
              {word && <X size={12} className="text-white/40 flex-shrink-0" />}
            </button>
          ))}
        </div>

        {/* Word bank */}
        <div className="card">
          <div className="flex flex-wrap gap-2">
            {wordBank.map((word, i) => (
              <button
                key={i}
                onClick={() => pickWord(word)}
                disabled={usedWords.has(word)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  usedWords.has(word)
                    ? 'bg-white/5 text-white/20 cursor-not-allowed'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {word}
              </button>
            ))}
          </div>
        </div>

        {isComplete && (
          <div
            className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${
              isCorrect
                ? 'bg-green-500/20 text-green-300'
                : 'bg-red-500/20 text-red-300'
            }`}
          >
            {isCorrect ? <Check size={16} /> : <X size={16} />}
            {isCorrect ? 'Correct! Your phrase matches.' : 'Incorrect order. Try again.'}
          </div>
        )}

        <button
          className="btn-primary"
          disabled={!isComplete || !isCorrect}
          onClick={confirm}
        >
          Confirm & Continue
        </button>
      </div>
    </div>
  );
}
