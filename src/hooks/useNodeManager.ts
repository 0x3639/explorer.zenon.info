'use client';

import { useState, useEffect, useCallback } from 'react';
import { CONFIG } from '@/lib/constants';

export interface NodeConfig {
  url: string;
  name: string;
  isDefault: boolean;
}

const STORAGE_KEY = 'zenon-explorer-nodes';
const SELECTED_NODE_KEY = 'zenon-explorer-selected-node';

function getInitialNodes(): NodeConfig[] {
  if (typeof window === 'undefined') {
    return [...CONFIG.NODE.DEFAULT_NODES];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse stored nodes:', e);
  }

  return [...CONFIG.NODE.DEFAULT_NODES];
}

function getInitialSelectedUrl(): string {
  if (typeof window === 'undefined') {
    return CONFIG.NODE.DEFAULT_URL;
  }

  try {
    const stored = localStorage.getItem(SELECTED_NODE_KEY);
    if (stored) {
      return stored;
    }
  } catch (e) {
    console.error('Failed to get selected node:', e);
  }

  return CONFIG.NODE.DEFAULT_URL;
}

export function useNodeManager() {
  const [nodes, setNodes] = useState<NodeConfig[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<string>(CONFIG.NODE.DEFAULT_URL);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    const initialNodes = getInitialNodes();
    const initialSelected = getInitialSelectedUrl();

    // Ensure selected URL exists in nodes list
    const selectedExists = initialNodes.some(n => n.url === initialSelected);

    setNodes(initialNodes);
    setSelectedUrl(selectedExists ? initialSelected : initialNodes[0]?.url || CONFIG.NODE.DEFAULT_URL);
    setIsInitialized(true);
  }, []);

  // Persist nodes to localStorage
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
    }
  }, [nodes, isInitialized]);

  // Persist selected node to localStorage
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      localStorage.setItem(SELECTED_NODE_KEY, selectedUrl);
    }
  }, [selectedUrl, isInitialized]);

  const addNode = useCallback((url: string, name?: string) => {
    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('wss://') && !normalizedUrl.startsWith('ws://')) {
      normalizedUrl = 'wss://' + normalizedUrl;
    }

    // Check if already exists
    if (nodes.some(n => n.url === normalizedUrl)) {
      return { success: false, error: 'Node already exists' };
    }

    // Validate URL format
    try {
      new URL(normalizedUrl);
    } catch {
      return { success: false, error: 'Invalid URL format' };
    }

    const newNode: NodeConfig = {
      url: normalizedUrl,
      name: name || extractNodeName(normalizedUrl),
      isDefault: false,
    };

    setNodes(prev => [...prev, newNode]);
    return { success: true };
  }, [nodes]);

  const removeNode = useCallback((url: string) => {
    setNodes(prev => {
      const filtered = prev.filter(n => n.url !== url);
      // If we removed the selected node, select the first remaining
      if (selectedUrl === url && filtered.length > 0) {
        setSelectedUrl(filtered[0].url);
      }
      return filtered;
    });
  }, [selectedUrl]);

  const selectNode = useCallback((url: string) => {
    if (nodes.some(n => n.url === url)) {
      setSelectedUrl(url);
    }
  }, [nodes]);

  const resetToDefaults = useCallback(() => {
    const defaultNodes = [...CONFIG.NODE.DEFAULT_NODES];
    setNodes(defaultNodes);
    setSelectedUrl(CONFIG.NODE.DEFAULT_URL);
  }, []);

  const getSelectedNode = useCallback((): NodeConfig | undefined => {
    return nodes.find(n => n.url === selectedUrl);
  }, [nodes, selectedUrl]);

  return {
    nodes,
    selectedUrl,
    selectedNode: getSelectedNode(),
    isInitialized,
    addNode,
    removeNode,
    selectNode,
    resetToDefaults,
  };
}

function extractNodeName(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return url;
  }
}
