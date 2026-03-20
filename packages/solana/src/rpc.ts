import { Connection } from '@solana/web3.js';
import type { Network } from '@kibipay/shared-types';

export const RPC_ENDPOINTS: Record<Network, string> = {
  'mainnet-beta': 'https://api.mainnet-beta.solana.com',
  devnet: 'https://api.devnet.solana.com',
  testnet: 'https://api.testnet.solana.com',
};

const connections = new Map<string, Connection>();

export function getConnection(network: Network, customEndpoint?: string | null): Connection {
  const endpoint = customEndpoint ?? RPC_ENDPOINTS[network];
  const cached = connections.get(endpoint);
  if (cached) return cached;

  const conn = new Connection(endpoint, {
    commitment: 'confirmed',
    disableRetryOnRateLimit: false,
  });
  connections.set(endpoint, conn);
  return conn;
}

export function clearConnectionCache(): void {
  connections.clear();
}
