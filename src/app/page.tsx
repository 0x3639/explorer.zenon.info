'use client';

import { Header } from '@/components/layout/Header';
import { SearchBar } from '@/components/ui/SearchBar';
import { MomentumsList } from '@/components/dashboard/MomentumsList';
import { TransactionsList } from '@/components/dashboard/TransactionsList';
import { useZenonWebSocket } from '@/hooks/useZenonWebSocket';

export default function Dashboard() {
  const { status } = useZenonWebSocket();

  const handleSearch = (query: string) => {
    // Determine search type and redirect
    if (query.startsWith('z1')) {
      // Address search
      window.location.href = `/address/${query}`;
    } else if (query.length === 64) {
      // Hash search (momentum or transaction)
      window.location.href = `/hash/${query}`;
    } else if (/^\d+$/.test(query)) {
      // Momentum height
      window.location.href = `/momentum/${query}`;
    }
  };

  return (
    <div className="min-h-screen bg-[#121212]">
      <Header status={status} onSearch={handleSearch} />

      {/* Hero Section */}
      <div className="bg-[#1a1a1a] py-12 px-4">
        <div className="max-w-[1600px] mx-auto text-center">
          <h1 className="text-3xl font-bold text-white mb-8">
            Welcome to Zenon Explorer
          </h1>
          <SearchBar onSearch={handleSearch} />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MomentumsList isConnected={status === 'connected'} />
          <TransactionsList isConnected={status === 'connected'} />
        </div>
      </main>
    </div>
  );
}
