import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useSolBalance, useTokenAccounts, useSolPrice } from '../../hooks/useSolana.js';
import BackButton from '../../components/BackButton.js';

export default function SelectToken() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { data: balData } = useSolBalance();
  const { data: tokenData } = useTokenAccounts();
  const { data: solPrice } = useSolPrice();

  const solLamports = BigInt(balData?.balance ?? '0');
  const solBalance = Number(solLamports) / 1_000_000_000;

  const select = (token: { mint?: string; symbol: string; decimals: number }) => {
    sessionStorage.setItem('kibipay_selected_token', JSON.stringify(token));
    navigate('/send');
  };

  const filtered = (tokenData?.tokens ?? []).filter(
    (t) =>
      t.symbol.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="screen">
      <div className="screen-header">
        <BackButton />
        <h2 className="font-bold text-white text-lg">Select Token</h2>
      </div>

      <div className="screen-body space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            className="input-field pl-9"
            placeholder="Search tokens..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          {/* SOL */}
          {(!search || 'sol'.includes(search.toLowerCase())) && (
            <button
              className="card w-full flex items-center gap-3 hover:bg-white/10 transition-colors text-left"
              onClick={() => select({ symbol: 'SOL', decimals: 9 })}
            >
              <div className="w-8 h-8 bg-[#9945FF] rounded-full flex items-center justify-center text-xs font-bold text-white">S</div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">SOL</p>
                <p className="text-white/40 text-xs">Solana</p>
              </div>
              <p className="text-white text-sm">{solBalance.toFixed(4)}</p>
            </button>
          )}

          {filtered.map((token) => (
            <button
              key={token.ata}
              className="card w-full flex items-center gap-3 hover:bg-white/10 transition-colors text-left"
              onClick={() => select({ mint: token.mint, symbol: token.symbol, decimals: token.decimals })}
            >
              <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center overflow-hidden">
                {token.logoURI ? (
                  <img src={token.logoURI} alt={token.symbol} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-white">{token.symbol.slice(0, 2)}</span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{token.symbol}</p>
                <p className="text-white/40 text-xs">{token.name}</p>
              </div>
              <p className="text-white text-sm">{token.uiAmount.toFixed(4)}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
