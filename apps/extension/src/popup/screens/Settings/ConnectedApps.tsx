import { useState, useEffect } from 'react';
import { Trash2, ExternalLink } from 'lucide-react';
import { useMessaging } from '../../hooks/useMessaging.js';
import type { DAppPermission } from '@kibipay/shared-types';
import BackButton from '../../components/BackButton.js';
import AddressDisplay from '../../components/AddressDisplay.js';

export default function ConnectedApps() {
  const { sendMessage } = useMessaging();
  const [permissions, setPermissions] = useState<DAppPermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sendMessage<{ permissions: DAppPermission[] }>('DAPP_GET_PERMISSIONS')
      .then((r) => setPermissions(r.permissions))
      .finally(() => setLoading(false));
  }, []);

  const revoke = async (origin: string) => {
    await sendMessage('DAPP_REVOKE_PERMISSION', { origin });
    setPermissions((prev) => prev.filter((p) => p.origin !== origin));
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <BackButton />
        <div>
          <h2 className="font-bold text-white text-lg">Connected Apps</h2>
          <p className="text-white/50 text-xs">{permissions.length} connected</p>
        </div>
      </div>

      <div className="screen-body">
        {loading && (
          <div className="flex justify-center pt-8">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {!loading && permissions.length === 0 && (
          <div className="text-center pt-12 space-y-2">
            <p className="text-white/40 text-sm">No connected apps</p>
            <p className="text-white/25 text-xs">dApps you connect to will appear here</p>
          </div>
        )}

        <div className="space-y-2">
          {permissions.map((perm) => (
            <div key={perm.origin} className="card flex items-center gap-3">
              <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                {perm.favicon ? (
                  <img src={perm.favicon} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ExternalLink size={14} className="text-white/50" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {perm.name ?? new URL(perm.origin).hostname}
                </p>
                <AddressDisplay address={perm.publicKey} chars={4} showCopy={false} />
              </div>
              <button
                onClick={() => revoke(perm.origin)}
                className="p-2 text-red-400/60 hover:text-red-400 transition-colors flex-shrink-0"
                aria-label="Disconnect"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
