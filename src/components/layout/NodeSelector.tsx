'use client';

import { useState, useRef, useEffect } from 'react';
import type { NodeConfig } from '@/hooks/useNodeManager';
import type { ConnectionStatus } from '@/types/zenon';

interface NodeSelectorProps {
  nodes: NodeConfig[];
  selectedUrl: string;
  status: ConnectionStatus;
  onSelectNode: (url: string) => void;
  onAddNode: (url: string, name?: string) => { success: boolean; error?: string };
  onRemoveNode: (url: string) => void;
}

export function NodeSelector({
  nodes,
  selectedUrl,
  status,
  onSelectNode,
  onAddNode,
  onRemoveNode,
}: NodeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNodeUrl, setNewNodeUrl] = useState('');
  const [newNodeName, setNewNodeName] = useState('');
  const [addError, setAddError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowAddForm(false);
        setAddError('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500 animate-pulse';
      case 'disconnected':
        return 'bg-gray-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const selectedNode = nodes?.find(n => n.url === selectedUrl);

  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');

    if (!newNodeUrl.trim()) {
      setAddError('Please enter a node URL');
      return;
    }

    const result = onAddNode(newNodeUrl.trim(), newNodeName.trim() || undefined);
    if (result.success) {
      setNewNodeUrl('');
      setNewNodeName('');
      setShowAddForm(false);
    } else {
      setAddError(result.error || 'Failed to add node');
    }
  };

  const handleSelectNode = (url: string) => {
    onSelectNode(url);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-black/80 hover:text-black transition-colors"
      >
        <span className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        <span className="text-sm font-medium hidden sm:inline">{getStatusText()}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#2a2a2a]">
            <h3 className="text-sm font-medium text-white">Node Connection</h3>
            {selectedNode && (
              <p className="text-xs text-gray-400 mt-1 truncate">
                {selectedNode.name} - {selectedNode.url}
              </p>
            )}
          </div>

          {/* Node list */}
          <div className="max-h-64 overflow-y-auto">
            {nodes?.map((node) => (
              <div
                key={node.url}
                className={`flex items-center justify-between px-4 py-3 hover:bg-[#2a2a2a] cursor-pointer ${
                  node.url === selectedUrl ? 'bg-[#2a2a2a]' : ''
                }`}
                onClick={() => handleSelectNode(node.url)}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Selection indicator */}
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      node.url === selectedUrl ? 'bg-[#7fff00]' : 'bg-gray-600'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{node.name}</p>
                    <p className="text-xs text-gray-500 truncate font-mono">{node.url}</p>
                  </div>
                </div>

                {/* Delete button (only for non-default nodes) */}
                {!node.isDefault && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveNode(node.url);
                    }}
                    className="p-1 text-gray-500 hover:text-red-400 transition-colors shrink-0 ml-2"
                    title="Remove node"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add node section */}
          <div className="border-t border-[#2a2a2a]">
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full px-4 py-3 text-sm text-[#7fff00] hover:bg-[#2a2a2a] transition-colors flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Node
              </button>
            ) : (
              <form onSubmit={handleAddNode} className="p-4 space-y-3">
                <div>
                  <input
                    type="text"
                    value={newNodeUrl}
                    onChange={(e) => {
                      setNewNodeUrl(e.target.value);
                      setAddError('');
                    }}
                    placeholder="wss://node.example.com:35998"
                    className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7fff00] font-mono"
                    autoFocus
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={newNodeName}
                    onChange={(e) => setNewNodeName(e.target.value)}
                    placeholder="Node name (optional)"
                    className="w-full bg-[#0a0a0a] border border-[#3a3a3a] rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7fff00]"
                  />
                </div>
                {addError && (
                  <p className="text-xs text-red-400">{addError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-[#7fff00] text-black font-medium py-2 rounded text-sm hover:bg-[#6cd900] transition-colors"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewNodeUrl('');
                      setNewNodeName('');
                      setAddError('');
                    }}
                    className="flex-1 bg-[#2a2a2a] text-gray-300 font-medium py-2 rounded text-sm hover:bg-[#3a3a3a] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
