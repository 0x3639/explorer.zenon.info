'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNodeManager, type NodeConfig } from '@/hooks/useNodeManager';
import { zenonClient } from '@/lib/zenon-api';
import type { ConnectionStatus } from '@/types/zenon';

interface ZenonContextValue {
  // Connection state
  status: ConnectionStatus;
  currentHeight: number;

  // Node management
  nodes: NodeConfig[];
  selectedNodeUrl: string;
  selectedNode: NodeConfig | undefined;

  // Actions
  selectNode: (url: string) => void;
  addNode: (url: string, name?: string) => { success: boolean; error?: string };
  removeNode: (url: string) => void;
}

const ZenonContext = createContext<ZenonContextValue | null>(null);

export function ZenonProvider({ children }: { children: React.ReactNode }) {
  const {
    nodes,
    selectedUrl,
    selectedNode,
    isInitialized,
    addNode,
    removeNode,
    selectNode: selectNodeInManager,
  } = useNodeManager();

  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [currentHeight, setCurrentHeight] = useState<number>(0);

  // Subscribe to status changes
  useEffect(() => {
    const handleStatusChange = (newStatus: ConnectionStatus) => {
      setStatus(newStatus);
    };

    zenonClient.addStatusListener(handleStatusChange);
    setStatus(zenonClient.getStatus());

    return () => {
      zenonClient.removeStatusListener(handleStatusChange);
    };
  }, []);

  // Connect to selected node when it changes or on initial load
  useEffect(() => {
    if (!isInitialized || !selectedUrl) return;

    zenonClient.connect(selectedUrl).catch(() => {
      // Error handled by status listener
    });
  }, [selectedUrl, isInitialized]);

  // Fetch and update current height
  useEffect(() => {
    if (status !== 'connected') return;

    // Fetch initial height
    zenonClient.getFrontierMomentum()
      .then(momentum => setCurrentHeight(momentum.height))
      .catch(() => {/* ignore */});

    // Update periodically
    const interval = setInterval(async () => {
      try {
        const momentum = await zenonClient.getFrontierMomentum();
        setCurrentHeight(momentum.height);
      } catch {
        // Ignore errors
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [status]);

  // Wrap selectNode to also trigger reconnection
  const selectNode = useCallback((url: string) => {
    selectNodeInManager(url);
    // Connection will happen automatically via the useEffect above
  }, [selectNodeInManager]);

  const value: ZenonContextValue = {
    status,
    currentHeight,
    nodes,
    selectedNodeUrl: selectedUrl,
    selectedNode,
    selectNode,
    addNode,
    removeNode,
  };

  return (
    <ZenonContext.Provider value={value}>
      {children}
    </ZenonContext.Provider>
  );
}

export function useZenon() {
  const context = useContext(ZenonContext);
  if (!context) {
    throw new Error('useZenon must be used within a ZenonProvider');
  }
  return context;
}
