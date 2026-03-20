// Entry point for the MAIN world injected script
import { KibiPayProvider } from './provider.js';
import { registerWalletStandard } from './wallet-standard.js';

const provider = new KibiPayProvider();

// Set window.solana (Phantom-compatible)
Object.defineProperty(window, 'solana', {
  value: provider,
  writable: false,
  configurable: false,
});

// Register with Wallet Standard
registerWalletStandard(provider);

// Announce to dApps that a wallet is available
window.dispatchEvent(new Event('kibipay#initialized'));
