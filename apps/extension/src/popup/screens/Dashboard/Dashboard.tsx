import { useNavigate } from 'react-router-dom';
import { Send, Download, ShoppingCart, Settings, RefreshCw, LogOut } from 'lucide-react';
import { useSolBalance, useTokenAccounts, useSolPrice } from '../../hooks/useSolana.js';
import { useWalletState, useWalletActions } from '../../hooks/useWallet.js';
import AddressDisplay from '../../components/AddressDisplay.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const { state } = useWalletState();
  const { lock } = useWalletActions();
  const { data: balData, isLoading: balLoading, refetch } = useSolBalance();
  const { data: tokenData } = useTokenAccounts();
  const { data: solPrice } = useSolPrice();

  const lamports = BigInt(balData?.balance ?? '0');
  const solBalance = Number(lamports) / 1_000_000_000;
  const usdValue = solPrice ? (solBalance * solPrice).toFixed(2) : null;

  const handleLock = async () => {
    await lock();
    navigate('/unlock', { replace: true });
  };

  return (
    <div className="screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <p className="text-white/40 text-xs">{state?.network ?? 'mainnet-beta'}</p>
          {state?.activeAccount && (
            <AddressDisplay address={state.activeAccount.publicKey} chars={4} />
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => refetch()}
            className="p-2 text-white/40 hover:text-white/80 transition-colors"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="p-2 text-white/40 hover:text-white/80 transition-colors"
          >
            <Settings size={16} />
          </button>
          <button
            onClick={handleLock}
            className="p-2 text-white/40 hover:text-white/80 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <div className="screen-body">
        {/* Balance */}
        <div className="text-center py-6">
          {balLoading ? (
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
          ) : (
            <>
              <p className="text-4xl font-bold text-white">
                {solBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 })} SOL
              </p>
              {usdValue && (
                <p className="text-white/50 text-lg mt-1">${usdValue} USD</p>
              )}
            </>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: Send, label: 'Send', action: () => navigate('/send') },
            { icon: Download, label: 'Receive', action: () => navigate('/receive') },
            { icon: ShoppingCart, label: 'Buy', action: () => navigate('/onramp') },
          ].map(({ icon: Icon, label, action }) => (
            <button
              key={label}
              onClick={action}
              className="flex flex-col items-center gap-2 py-4 card hover:bg-white/10 transition-colors"
            >
              <div className="w-10 h-10 bg-brand-500/20 rounded-full flex items-center justify-center">
                <Icon size={18} className="text-brand-400" />
              </div>
              <span className="text-white/70 text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>

        {/* Tokens */}
        <div>
          <h3 className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">Assets</h3>
          <div className="space-y-2">
            {/* SOL row */}
            <div className="card flex items-center gap-3">
              <div className="w-8 h-8 bg-[#9945FF] rounded-full flex items-center justify-center text-xs font-bold text-white">S</div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">SOL</p>
                <p className="text-white/40 text-xs">Solana</p>
              </div>
              <div className="text-right">
                <p className="text-white text-sm">
                  {solBalance.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                </p>
                {usdValue && <p className="text-white/40 text-xs">${usdValue}</p>}
              </div>
            </div>

            {/* SPL tokens */}
            {tokenData?.tokens.map((token) => (
              <div key={token.ata} className="card flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center overflow-hidden">
                  {token.logoURI ? (
                    <img src={token.logoURI} alt={token.symbol} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-white">{token.symbol.slice(0, 2)}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{token.symbol}</p>
                  <p className="text-white/40 text-xs truncate max-w-[100px]">{token.name}</p>
                </div>
                <p className="text-white text-sm">
                  {token.uiAmount.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
