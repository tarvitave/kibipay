import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Shield, Globe, Link, Eye, Trash2 } from 'lucide-react';
import { useWalletActions, useWalletState } from '../../hooks/useWallet.js';
import { useMessaging } from '../../hooks/useMessaging.js';
import BackButton from '../../components/BackButton.js';
import type { AppSettings } from '@kibipay/shared-types';

export default function Settings() {
  const navigate = useNavigate();
  const { deleteWallet, exportMnemonic, getSettings, updateSettings } = useWalletActions();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [showReveal, setShowReveal] = useState(false);
  const [revealPassword, setRevealPassword] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [revealError, setRevealError] = useState('');

  useEffect(() => {
    getSettings().then((s) => setSettings(s as AppSettings));
  }, []);

  const handleDeleteWallet = async () => {
    if (!window.confirm('Are you sure? This will permanently delete your wallet. You will need your recovery phrase to restore it.')) return;
    await deleteWallet();
    navigate('/onboarding/welcome', { replace: true });
  };

  const handleRevealMnemonic = async () => {
    try {
      const result = await exportMnemonic(revealPassword) as { mnemonic: string };
      setMnemonic(result.mnemonic);
      setRevealError('');
    } catch (e) {
      setRevealError(e instanceof Error ? e.message : 'Wrong password');
    }
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <BackButton />
        <h2 className="font-bold text-white text-lg">Settings</h2>
      </div>

      <div className="screen-body space-y-2">
        {/* Network */}
        <div className="card">
          <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">Network</p>
          <select
            className="input-field text-sm"
            value={settings?.network ?? 'mainnet-beta'}
            onChange={async (e) => {
              const updated = { ...settings, network: e.target.value } as AppSettings;
              await updateSettings({ network: e.target.value });
              setSettings(updated);
            }}
          >
            <option value="mainnet-beta">Mainnet Beta</option>
            <option value="devnet">Devnet</option>
            <option value="testnet">Testnet</option>
          </select>
        </div>

        {/* Security */}
        <div className="card">
          <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">Security</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="text-white/70 text-sm flex-1">Auto-lock (minutes)</label>
              <input
                type="number"
                className="input-field w-20 text-sm py-2"
                value={settings?.autoLockMinutes ?? 15}
                min={0}
                max={60}
                onChange={async (e) => {
                  const minutes = Number(e.target.value);
                  await updateSettings({ autoLockMinutes: minutes });
                  setSettings((prev) => prev ? { ...prev, autoLockMinutes: minutes } : prev);
                }}
              />
            </div>
          </div>
        </div>

        {/* Reveal Mnemonic */}
        <div className="card">
          <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">Recovery Phrase</p>
          {!showReveal ? (
            <button
              className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 text-sm transition-colors"
              onClick={() => setShowReveal(true)}
            >
              <Eye size={16} />
              Reveal recovery phrase
            </button>
          ) : mnemonic ? (
            <div className="space-y-3">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
                <p className="text-yellow-300 font-mono text-xs leading-relaxed break-words">{mnemonic}</p>
              </div>
              <button onClick={() => { setMnemonic(''); setShowReveal(false); }} className="text-white/40 text-xs hover:text-white/70">
                Hide phrase
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="password"
                className="input-field text-sm"
                placeholder="Enter password to reveal"
                value={revealPassword}
                onChange={(e) => setRevealPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRevealMnemonic()}
              />
              {revealError && <p className="text-red-400 text-xs">{revealError}</p>}
              <button className="btn-secondary text-sm py-2" onClick={handleRevealMnemonic}>Reveal</button>
            </div>
          )}
        </div>

        {/* Connected Apps */}
        <button
          className="card w-full flex items-center gap-3 hover:bg-white/10 transition-colors"
          onClick={() => navigate('/settings/connected-apps')}
        >
          <Link size={16} className="text-white/50" />
          <span className="text-white/80 text-sm flex-1 text-left">Connected Apps</span>
          <ChevronRight size={16} className="text-white/30" />
        </button>

        {/* Danger zone */}
        <div className="card border-red-500/20">
          <p className="text-red-400/70 text-xs font-medium uppercase tracking-wider mb-3">Danger Zone</p>
          <button className="btn-danger text-sm py-2" onClick={handleDeleteWallet}>
            <Trash2 size={16} className="inline mr-2" />
            Delete Wallet
          </button>
        </div>
      </div>
    </div>
  );
}
