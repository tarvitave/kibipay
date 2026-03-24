import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface AddressDisplayProps {
  address: string;
  chars?: number;
  showCopy?: boolean;
  className?: string;
}

export default function AddressDisplay({
  address,
  chars = 4,
  showCopy = true,
  className = '',
}: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  const short = `${address.slice(0, chars)}...${address.slice(-chars)}`;

  const copy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-sm text-white/70 ${className}`}>
      {short}
      {showCopy && (
        <button
          onClick={copy}
          className="text-white/40 hover:text-white/80 transition-colors"
          aria-label="Copy address"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        </button>
      )}
    </span>
  );
}
