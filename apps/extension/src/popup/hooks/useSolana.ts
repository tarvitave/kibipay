import { useQuery } from '@tanstack/react-query';
import type { TokenAccount, ParsedTransaction, SimulationResult } from '@kibipay/shared-types';
import { useMessaging } from './useMessaging.js';

export function useSolBalance() {
  const { sendMessage } = useMessaging();
  return useQuery({
    queryKey: ['sol-balance'],
    queryFn: () => sendMessage<{ balance: string; publicKey: string }>('SOL_GET_BALANCE'),
    refetchInterval: 30_000,
  });
}

export function useTokenAccounts() {
  const { sendMessage } = useMessaging();
  return useQuery({
    queryKey: ['token-accounts'],
    queryFn: () => sendMessage<{ tokens: TokenAccount[] }>('SOL_GET_TOKENS'),
    refetchInterval: 30_000,
  });
}

export function useTransactionHistory(limit = 20) {
  const { sendMessage } = useMessaging();
  return useQuery({
    queryKey: ['tx-history', limit],
    queryFn: () => sendMessage<{ history: ParsedTransaction[] }>('SOL_GET_HISTORY', { limit }),
    staleTime: 60_000,
  });
}

export function useSolPrice() {
  return useQuery({
    queryKey: ['sol-price'],
    queryFn: async () => {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
      );
      const data = await res.json();
      return (data?.solana?.usd ?? 0) as number;
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
