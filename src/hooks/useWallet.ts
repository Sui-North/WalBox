import { useCurrentAccount, useSignAndExecuteTransactionBlock, useSuiClient } from '@mysten/dapp-kit';
import { useCallback } from 'react';
import type { Transaction } from '@mysten/sui/transactions';

/**
 * Enhanced wallet hook using @mysten/dapp-kit
 * Provides wallet connection state and transaction signing methods
 */
export function useWallet() {
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransactionBlock } = useSignAndExecuteTransactionBlock();
  const suiClient = useSuiClient();

  const isConnected = useCallback(() => {
    return !!account?.address;
  }, [account?.address]);

  const getAddress = useCallback(() => {
    return account?.address || null;
  }, [account?.address]);

  const formatAddress = useCallback((address: string) => {
    if (!address || address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  const executeTransaction = useCallback(
    async (transactionBlock: any, options?: any) => {
      return new Promise((resolve, reject) => {
        if (!account?.address) {
          reject(new Error('Wallet not connected'));
          return;
        }

        signAndExecuteTransactionBlock(
          {
            transactionBlock: transactionBlock,
            account: account,
            options: options || {
              showEffects: true,
              showEvents: true,
            },
          } as any,
          {
            onSuccess: (result: any) => {
              resolve(result.digest || result.transactionDigest);
            },
            onError: (error: any) => {
              reject(error);
            },
          }
        );
      });
    },
    [account, signAndExecuteTransactionBlock]
  );

  return {
    account,
    address: account?.address || null,
    isConnected: isConnected(),
    formatAddress,
    executeTransaction,
    suiClient,
  };
}
