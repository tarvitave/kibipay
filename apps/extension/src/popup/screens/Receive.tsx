import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useWalletState } from '../hooks/useWallet.js';
import BackButton from '../components/BackButton.js';

export default function Receive() {
  const { state } = useWalletState();
  const address = state?.activeAccount?.publicKey ?? '';
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <BackButton />
        <h2 className="font-bold text-white text-lg">Receive</h2>
      </div>

      <div className="screen-body items-center flex flex-col gap-6 pt-4">
        <p className="text-white/60 text-sm text-center">
          Share your address to receive SOL or SPL tokens
        </p>

        <div className="bg-white p-4 rounded-2xl">
          <QRCode value={address} size={200} />
        </div>

        <div className="w-full card">
          <p className="text-white/40 text-xs mb-2">Your Solana Address</p>
          <p className="text-white font-mono text-xs break-all leading-relaxed">{address}</p>
        </div>

        <button className="btn-primary flex items-center justify-center gap-2" onClick={copy}>
          {copied ? <Check size={18} /> : <Copy size={18} />}
          {copied ? 'Copied!' : 'Copy Address'}
        </button>
      </div>
    </div>
  );
}
