import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { isValidPublicKey } from '@kibipay/crypto';
import { useSolBalance, useTokenAccounts } from '../../hooks/useSolana.js';
import BackButton from '../../components/BackButton.js';

export default function Send() {
  const navigate = useNavigate();
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');

  const { data: balData } = useSolBalance();
  const { data: tokenData } = useTokenAccounts();

  const selectedTokenRaw = sessionStorage.getItem('kibipay_selected_token');
  const selectedToken = selectedTokenRaw ? JSON.parse(selectedTokenRaw) : { symbol: 'SOL', decimals: 9 };

  const isSOL = !selectedToken.mint;
  const solLamports = BigInt(balData?.balance ?? '0');
  const maxBalance = isSOL
    ? (Number(solLamports) / 1e9).toFixed(9)
    : (tokenData?.tokens.find((t) => t.mint === selectedToken.mint)?.uiAmount ?? 0).toString();

  const isAddressValid = isValidPublicKey(to);
  const isAmountValid = Number(amount) > 0 && Number(amount) <= Number(maxBalance);
  const canProceed = isAddressValid && isAmountValid;

  const proceed = () => {
    sessionStorage.setItem('kibipay_send_params', JSON.stringify({ to, amount, token: selectedToken }));
    navigate('/send/review');
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <BackButton />
        <h2 className="font-bold text-white text-lg">Send</h2>
      </div>

      <div className="screen-body space-y-4">
        {/* Token selector */}
        <button
          className="card w-full flex items-center gap-3 hover:bg-white/10 transition-colors"
          onClick={() => navigate('/send/select-token')}
        >
          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-xs font-bold text-white">
            {selectedToken.symbol.slice(0, 2)}
          </div>
          <div className="flex-1 text-left">
            <p className="text-white font-medium">{selectedToken.symbol}</p>
            <p className="text-white/40 text-xs">Balance: {Number(maxBalance).toFixed(4)}</p>
          </div>
          <ChevronDown size={16} className="text-white/40" />
        </button>

        {/* Recipient */}
        <div>
          <label className="text-white/50 text-xs font-medium block mb-1.5">Recipient address</label>
          <input
            className={`input-field ${to && !isAddressValid ? 'border-red-500' : ''}`}
            placeholder="Solana address (base58)"
            value={to}
            onChange={(e) => setTo(e.target.value.trim())}
          />
          {to && !isAddressValid && (
            <p className="text-red-400 text-xs mt-1">Invalid Solana address</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <div className="flex justify-between mb-1.5">
            <label className="text-white/50 text-xs font-medium">Amount</label>
            <button
              className="text-brand-400 text-xs hover:text-brand-300"
              onClick={() => setAmount(maxBalance)}
            >
              Max
            </button>
          </div>
          <input
            className="input-field"
            type="number"
            placeholder={`0.00 ${selectedToken.symbol}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="any"
          />
        </div>

        <button
          className="btn-primary"
          disabled={!canProceed}
          onClick={proceed}
        >
          Review Transaction
        </button>
      </div>
    </div>
  );
}
