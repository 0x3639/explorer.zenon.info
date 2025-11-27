'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { zenonClient } from '@/lib/zenon-api';
import type { ConnectionStatus, Momentum, AccountBlock } from '@/types/zenon';

const DEFAULT_NODE = 'wss://my.hc1node.com:35998';

export function useZenonWebSocket(nodeUrl: string = DEFAULT_NODE) {
  const [status, setStatus] = useState<ConnectionStatus>(() => zenonClient.getStatus());
  const [error, setError] = useState<string | null>(null);
  const [currentHeight, setCurrentHeight] = useState<number>(0);

  // Subscribe to status changes
  useEffect(() => {
    const handleStatusChange = (newStatus: ConnectionStatus) => {
      setStatus(newStatus);
      if (newStatus === 'error') {
        setError('Connection error');
      } else {
        setError(null);
      }
    };

    zenonClient.addStatusListener(handleStatusChange);

    // Initiate connection if not already connected
    zenonClient.connect(nodeUrl).catch(() => {
      // Error handled by status listener
    });

    return () => {
      zenonClient.removeStatusListener(handleStatusChange);
      // Don't disconnect - keep connection alive for other components
    };
  }, [nodeUrl]);

  // Fetch initial height when connected
  useEffect(() => {
    if (status === 'connected' && currentHeight === 0) {
      zenonClient.getFrontierMomentum()
        .then(momentum => setCurrentHeight(momentum.height))
        .catch(() => {/* ignore */});
    }
  }, [status, currentHeight]);

  // Update current height periodically
  useEffect(() => {
    if (status !== 'connected') return;

    const interval = setInterval(async () => {
      try {
        const momentum = await zenonClient.getFrontierMomentum();
        setCurrentHeight(momentum.height);
      } catch {
        // Ignore errors, will retry on next interval
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [status]);

  const connect = useCallback(async () => {
    try {
      await zenonClient.connect(nodeUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    }
  }, [nodeUrl]);

  const disconnect = useCallback(() => {
    zenonClient.disconnect();
  }, []);

  return {
    status,
    error,
    currentHeight,
    connect,
    disconnect,
    client: zenonClient,
  };
}

export function useMomentumSubscription(onMomentum: (momentum: Momentum) => void) {
  const subscriptionRef = useRef<string | null>(null);

  useEffect(() => {
    const subscribe = async () => {
      try {
        subscriptionRef.current = await zenonClient.subscribeToMomentums((data) => {
          onMomentum(data as Momentum);
        });
      } catch {
        // Subscription failed, will use polling instead
      }
    };

    subscribe();

    return () => {
      if (subscriptionRef.current) {
        zenonClient.unsubscribe(subscriptionRef.current);
      }
    };
  }, [onMomentum]);
}

export function useAccountBlockSubscription(onBlock: (block: AccountBlock) => void) {
  const subscriptionRef = useRef<string | null>(null);

  useEffect(() => {
    const subscribe = async () => {
      try {
        subscriptionRef.current = await zenonClient.subscribeToAllAccountBlocks((data) => {
          onBlock(data as AccountBlock);
        });
      } catch {
        // Subscription failed
      }
    };

    subscribe();

    return () => {
      if (subscriptionRef.current) {
        zenonClient.unsubscribe(subscriptionRef.current);
      }
    };
  }, [onBlock]);
}
