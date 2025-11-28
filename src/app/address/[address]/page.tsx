'use client';

export const runtime = 'edge';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { HashLink } from '@/components/ui/HashLink';
import { TokenSymbolLink } from '@/components/ui/TokenSymbolLink';
import { JsonViewer } from '@/components/ui/JsonViewer';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { formatFullTimestamp, formatTokenAmount, copyToClipboard } from '@/lib/utils';
import { useZenon } from '@/contexts/ZenonProvider';
import { zenonClient } from '@/lib/zenon-api';
import type { AccountInfo, AccountBlock, Token } from '@/types/zenon';

// Block type mapping
const BLOCK_TYPES: Record<number, string> = {
  1: 'GENESIS RECEIVE',
  2: 'USER SEND',
  3: 'USER RECEIVE',
  4: 'CONTRACT SEND',
  5: 'CONTRACT RECEIVE',
};

type TabType = 'transactions' | 'unreceived' | 'zts';

export default function AddressDetailPage() {
  const params = useParams();
  const { status, currentHeight, nodes, selectedNodeUrl, selectNode, addNode, removeNode } = useZenon();
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [transactions, setTransactions] = useState<AccountBlock[]>([]);
  const [unreceived, setUnreceived] = useState<AccountBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('transactions');
  const [copied, setCopied] = useState(false);

  // Pagination state
  const [txPage, setTxPage] = useState(0);
  const [txPageSize, setTxPageSize] = useState(10);
  const [txTotal, setTxTotal] = useState(0);

  const [unreceivedPage, setUnreceivedPage] = useState(0);
  const [unreceivedPageSize, setUnreceivedPageSize] = useState(10);
  const [unreceivedTotal, setUnreceivedTotal] = useState(0);

  const [ztsPage, setZtsPage] = useState(0);
  const [ztsPageSize, setZtsPageSize] = useState(10);

  const address = params.address as string;

  const fetchAccountInfo = useCallback(async () => {
    if (!zenonClient.isConnected()) return;

    setLoading(true);
    setError(null);

    try {
      const info = await zenonClient.getAccountInfoByAddress(address);
      setAccountInfo(info);
    } catch (err) {
      console.error('Failed to fetch account info:', err);
      setError('Failed to load address details');
    } finally {
      setLoading(false);
    }
  }, [address]);

  const fetchTransactions = useCallback(async () => {
    if (!zenonClient.isConnected()) return;

    try {
      const result = await zenonClient.getAccountBlocksByPage(address, txPage, txPageSize);
      setTransactions(result.list);
      setTxTotal(result.count);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  }, [address, txPage, txPageSize]);

  const fetchUnreceived = useCallback(async () => {
    if (!zenonClient.isConnected()) return;

    try {
      const result = await zenonClient.getUnreceivedBlocksByAddress(address, unreceivedPage, unreceivedPageSize);
      setUnreceived(result.list);
      setUnreceivedTotal(result.count);
    } catch (err) {
      console.error('Failed to fetch unreceived:', err);
    }
  }, [address, unreceivedPage, unreceivedPageSize]);

  useEffect(() => {
    if (status === 'connected') {
      fetchAccountInfo();
    }
  }, [status, fetchAccountInfo]);

  useEffect(() => {
    if (status === 'connected' && activeTab === 'transactions') {
      fetchTransactions();
    }
  }, [status, activeTab, fetchTransactions]);

  useEffect(() => {
    if (status === 'connected' && activeTab === 'unreceived') {
      fetchUnreceived();
    }
  }, [status, activeTab, fetchUnreceived]);

  const handleCopyAddress = async () => {
    const success = await copyToClipboard(address);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getConfirmations = (tx: AccountBlock) => {
    if (!tx.confirmationDetail?.momentumHeight) return 0;
    return Math.max(0, currentHeight - tx.confirmationDetail.momentumHeight);
  };

  // Get balances as array for ZTS tab
  const balances = accountInfo?.balanceInfoMap
    ? Object.entries(accountInfo.balanceInfoMap).map(([zts, info]) => ({
        zts,
        token: info.token,
        balance: info.balance,
      }))
    : [];

  const tabs: { id: TabType; label: string }[] = [
    { id: 'transactions', label: 'Transactions' },
    { id: 'unreceived', label: 'Unreceived Transactions' },
    { id: 'zts', label: 'ZTS' },
  ];

  return (
    <div className="min-h-screen bg-[#121212]">
      <Header
        status={status}
        nodes={nodes}
        selectedNodeUrl={selectedNodeUrl}
        onSelectNode={selectNode}
        onAddNode={addNode}
        onRemoveNode={removeNode}
      />

      {/* Page Header */}
      <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1600px] mx-auto">
          <h1 className="text-white text-sm font-medium mb-2 sm:mb-0 sm:inline">Address Details</h1>
          <span className="text-gray-600 hidden sm:inline mx-4">|</span>
          <div className="flex items-center gap-2">
            <span className="text-white font-mono text-xs sm:text-sm break-all">{address}</span>
            <button
              onClick={handleCopyAddress}
              className="p-1.5 hover:bg-[#2a2a2a] rounded shrink-0"
              title={copied ? 'Copied!' : 'Copy to clipboard'}
            >
              {copied ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#7fff00]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-[#2a2a2a] rounded w-1/4" />
              <div className="h-4 bg-[#2a2a2a] rounded w-3/4" />
              <div className="h-4 bg-[#2a2a2a] rounded w-1/2" />
            </div>
          </div>
        ) : error ? (
          <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-6">
            <p className="text-red-400">{error}</p>
          </div>
        ) : accountInfo ? (
          <div className="space-y-6">
            {/* Address Info */}
            <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-4 sm:p-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="text-gray-400 text-sm sm:text-base sm:w-40 shrink-0">Address:</span>
                  <HashLink hash={accountInfo.address} type="address" noTruncate showCopy isCurrentPage />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="text-gray-400 text-sm sm:text-base sm:w-40 shrink-0">Account Height:</span>
                  <span className="text-white font-mono">
                    {accountInfo.accountHeight.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-[#2a2a2a] -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="flex gap-4 sm:gap-8 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'text-white border-[#7fff00]'
                        : 'text-gray-400 border-transparent hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'transactions' && (
              <div>
                <div className="flex items-center justify-end mb-3">
                  <Pagination
                    currentPage={txPage}
                    totalItems={txTotal}
                    pageSize={txPageSize}
                    onPageChange={setTxPage}
                    onPageSizeChange={(size) => {
                      setTxPageSize(size);
                      setTxPage(0);
                    }}
                  />
                </div>
                <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] overflow-hidden">
                  <Table
                    columns={[
                      {
                        key: 'hash',
                        header: 'Transaction Hash',
                        mobilePrimary: true,
                        render: (tx: AccountBlock) => (
                          <HashLink hash={tx.hash} truncateStart={24} type="transaction" linkToDetail showCopy />
                        ),
                      },
                      {
                        key: 'type',
                        header: 'Type',
                        render: (tx: AccountBlock) => (
                          <span className="text-gray-300 text-sm">
                            {BLOCK_TYPES[tx.blockType] || `TYPE ${tx.blockType}`}
                          </span>
                        ),
                      },
                      {
                        key: 'height',
                        header: 'Height',
                        mobileLabel: false,
                        render: (tx: AccountBlock) => (
                          <span className="text-gray-300">{tx.height.toLocaleString()}</span>
                        ),
                      },
                      {
                        key: 'timestamp',
                        header: 'Timestamp',
                        mobileLabel: false,
                        render: (tx: AccountBlock) => (
                          <span className="text-gray-300 text-sm">
                            {tx.confirmationDetail?.momentumTimestamp
                              ? formatFullTimestamp(tx.confirmationDetail.momentumTimestamp)
                              : '-'}
                          </span>
                        ),
                      },
                      {
                        key: 'amount',
                        header: 'Amount',
                        render: (tx: AccountBlock) => {
                          if (!tx.amount || tx.amount === '0') {
                            return <span className="text-gray-300">0</span>;
                          }
                          const decimals = tx.token?.decimals || 8;
                          return (
                            <span className="text-gray-300">
                              {formatTokenAmount(tx.amount, decimals)}
                            </span>
                          );
                        },
                      },
                      {
                        key: 'symbol',
                        header: 'Symbol',
                        render: (tx: AccountBlock) => (
                          tx.token?.symbol && tx.tokenStandard ? (
                            <TokenSymbolLink symbol={tx.token.symbol} tokenStandard={tx.tokenStandard} />
                          ) : (
                            <span className="text-[#7fff00]">{tx.token?.symbol || ''}</span>
                          )
                        ),
                      },
                      {
                        key: 'confirmations',
                        header: 'Confirmations',
                        mobileLabel: 'Confirms',
                        render: (tx: AccountBlock) => (
                          <span className="text-[#7fff00]">{getConfirmations(tx)}</span>
                        ),
                      },
                      {
                        key: 'from',
                        header: 'From Address',
                        mobileLabel: 'From',
                        render: (tx: AccountBlock) => (
                          <HashLink hash={tx.address} type="address" linkToDetail showCopy />
                        ),
                      },
                      {
                        key: 'to',
                        header: 'To Address',
                        mobileLabel: 'To',
                        render: (tx: AccountBlock) => (
                          <HashLink hash={tx.toAddress} type="address" linkToDetail showCopy />
                        ),
                      },
                    ]}
                    data={transactions}
                    keyExtractor={(tx) => tx.hash}
                    loading={false}
                    emptyMessage="No transactions"
                  />
                </div>
              </div>
            )}

            {activeTab === 'unreceived' && (
              <div>
                <div className="flex items-center justify-end mb-3">
                  <Pagination
                    currentPage={unreceivedPage}
                    totalItems={unreceivedTotal}
                    pageSize={unreceivedPageSize}
                    onPageChange={setUnreceivedPage}
                    onPageSizeChange={(size) => {
                      setUnreceivedPageSize(size);
                      setUnreceivedPage(0);
                    }}
                  />
                </div>
                {unreceived.length === 0 ? (
                  <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-12 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="relative w-32 h-32">
                        <div className="absolute inset-0 flex items-center justify-center opacity-20">
                          <svg viewBox="0 0 100 100" className="w-full h-full">
                            <circle cx="50" cy="50" r="40" stroke="#7fff00" strokeWidth="1" fill="none" opacity="0.3" />
                            <circle cx="50" cy="50" r="30" stroke="#7fff00" strokeWidth="1" fill="none" opacity="0.2" />
                          </svg>
                        </div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                          <div className="flex items-center gap-2 bg-[#2a2a2a] rounded px-3 py-1">
                            <span className="w-5 h-5 bg-[#7fff00] text-black rounded flex items-center justify-center text-xs font-bold">?</span>
                            <div className="w-16 h-2 bg-[#3a3a3a] rounded" />
                          </div>
                          <div className="flex items-center gap-2 bg-[#2a2a2a] rounded px-3 py-1">
                            <span className="w-5 h-5 bg-[#7fff00] text-black rounded flex items-center justify-center text-xs font-bold">?</span>
                            <div className="w-20 h-2 bg-[#3a3a3a] rounded" />
                          </div>
                          <div className="flex items-center gap-2 bg-[#2a2a2a] rounded px-3 py-1">
                            <span className="w-5 h-5 bg-[#7fff00] text-black rounded flex items-center justify-center text-xs font-bold">?</span>
                            <div className="w-14 h-2 bg-[#3a3a3a] rounded" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <h3 className="text-gray-300 text-lg font-medium mb-2">No results found</h3>
                    <p className="text-gray-500">We didn&apos;t find anything. Try changing the search criteria.</p>
                  </div>
                ) : (
                  <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] overflow-hidden">
                    <Table
                      columns={[
                        {
                          key: 'hash',
                          header: 'Transaction Hash',
                          mobilePrimary: true,
                          render: (tx: AccountBlock) => (
                            <HashLink hash={tx.hash} truncateStart={24} type="transaction" linkToDetail showCopy />
                          ),
                        },
                        {
                          key: 'from',
                          header: 'From Address',
                          mobileLabel: 'From',
                          render: (tx: AccountBlock) => (
                            <HashLink hash={tx.address} type="address" linkToDetail showCopy />
                          ),
                        },
                        {
                          key: 'amount',
                          header: 'Amount',
                          render: (tx: AccountBlock) => {
                            if (!tx.amount || tx.amount === '0') {
                              return <span className="text-gray-300">0</span>;
                            }
                            const decimals = tx.token?.decimals || 8;
                            return (
                              <span className="text-gray-300">
                                {formatTokenAmount(tx.amount, decimals)}
                              </span>
                            );
                          },
                        },
                        {
                          key: 'symbol',
                          header: 'Symbol',
                          render: (tx: AccountBlock) => (
                            tx.token?.symbol && tx.tokenStandard ? (
                              <TokenSymbolLink symbol={tx.token.symbol} tokenStandard={tx.tokenStandard} />
                            ) : (
                              <span className="text-[#7fff00]">{tx.token?.symbol || ''}</span>
                            )
                          ),
                        },
                      ]}
                      data={unreceived}
                      keyExtractor={(tx) => tx.hash}
                      loading={false}
                      emptyMessage="No unreceived transactions"
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'zts' && (
              <div>
                {balances.length > 0 && (
                  <div className="flex items-center justify-end mb-3">
                    <Pagination
                      currentPage={ztsPage}
                      totalItems={balances.length}
                      pageSize={ztsPageSize}
                      onPageChange={setZtsPage}
                      onPageSizeChange={(size) => {
                        setZtsPageSize(size);
                        setZtsPage(0);
                      }}
                    />
                  </div>
                )}
                {balances.length === 0 ? (
                  <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-12 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="relative w-48 h-48">
                        {/* Circular background lines */}
                        <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full">
                          {/* Outer arc */}
                          <path
                            d="M 160 40 A 80 80 0 0 1 180 100"
                            stroke="#7fff00"
                            strokeWidth="1"
                            fill="none"
                            opacity="0.2"
                          />
                          <path
                            d="M 180 100 A 80 80 0 0 1 140 170"
                            stroke="#7fff00"
                            strokeWidth="1"
                            fill="none"
                            opacity="0.15"
                          />
                          {/* Inner arc */}
                          <path
                            d="M 140 50 A 60 60 0 0 1 160 100"
                            stroke="#7fff00"
                            strokeWidth="1"
                            fill="none"
                            opacity="0.15"
                          />
                          <path
                            d="M 160 100 A 60 60 0 0 1 120 150"
                            stroke="#7fff00"
                            strokeWidth="1"
                            fill="none"
                            opacity="0.1"
                          />
                        </svg>
                        {/* Card items */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                          <div className="flex items-center gap-2 bg-[#2a2a2a] rounded-lg px-4 py-2 shadow-lg transform -rotate-3 translate-x-4">
                            <span className="w-6 h-6 bg-[#7fff00] text-black rounded flex items-center justify-center text-sm font-bold">?</span>
                            <div className="w-20 h-2 bg-[#3a3a3a] rounded" />
                          </div>
                          <div className="flex items-center gap-2 bg-[#2a2a2a] rounded-lg px-4 py-2 shadow-lg transform rotate-1 translate-x-8">
                            <span className="w-6 h-6 bg-[#7fff00] text-black rounded flex items-center justify-center text-sm font-bold">?</span>
                            <div className="w-24 h-2 bg-[#3a3a3a] rounded" />
                          </div>
                          <div className="flex items-center gap-2 bg-[#2a2a2a] rounded-lg px-4 py-2 shadow-lg transform -rotate-2 translate-x-2">
                            <span className="w-6 h-6 bg-[#7fff00] text-black rounded flex items-center justify-center text-sm font-bold">?</span>
                            <div className="w-16 h-2 bg-[#3a3a3a] rounded" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <h3 className="text-gray-300 text-lg font-medium mb-2">No results found</h3>
                    <p className="text-gray-500">We didn&apos;t find anything. Try changing the search criteria.</p>
                  </div>
                ) : (
                  <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] overflow-hidden">
                    <Table
                      columns={[
                        {
                          key: 'symbol',
                          header: 'Symbol',
                          mobilePrimary: true,
                          render: (item: { token: Token }) => (
                            <TokenSymbolLink symbol={item.token.symbol} tokenStandard={item.token.tokenStandard} />
                          ),
                        },
                        {
                          key: 'balance',
                          header: 'Balance',
                          render: (item: { token: Token; balance: string }) => (
                            <span className="text-gray-300">
                              {formatTokenAmount(item.balance, item.token.decimals)}
                            </span>
                          ),
                        },
                        {
                          key: 'zts',
                          header: 'ZTS',
                          render: (item: { token: Token }) => (
                            <HashLink hash={item.token.tokenStandard} type="zts" linkToDetail showCopy />
                          ),
                        },
                      ]}
                      data={balances.slice(ztsPage * ztsPageSize, (ztsPage + 1) * ztsPageSize)}
                      keyExtractor={(item) => item.zts}
                      loading={false}
                      emptyMessage="No ZTS tokens"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Raw Data */}
            <JsonViewer data={accountInfo} title="Raw data" />
          </div>
        ) : null}
      </main>
    </div>
  );
}
