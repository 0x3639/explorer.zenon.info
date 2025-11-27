'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ConnectionStatus } from '@/types/zenon';
import { getSearchUrl, getSearchType } from '@/lib/validators';

interface HeaderProps {
  status: ConnectionStatus;
}

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/momentums', label: 'Momentums' },
  { href: '/sentinels', label: 'Sentinels' },
  { href: '/pillars', label: 'Pillars' },
  { href: '/tokens', label: 'ZTS' },
];

export function Header({ status }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    setSearchError('');

    if (!query) return;

    // Use validators to determine search type and URL
    const searchUrl = getSearchUrl(query);

    if (searchUrl) {
      router.push(searchUrl);
      setShowSearch(false);
      setSearchQuery('');
      return;
    }

    // Invalid search - could not determine type
    const searchType = getSearchType(query);
    if (!searchType) {
      setSearchError('Invalid search. Enter an address (z1...), token (zts1...), momentum height, or hash.');
    }
  };

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

  return (
    <header className="bg-[#7fff00] sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo and Nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="text-black font-bold text-xl tracking-tight">
              Zenon Explorer
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2 text-sm font-medium text-black/80 hover:text-black transition-colors relative ${
                      isActive ? 'text-black' : ''
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-4">
            {/* Search toggle */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 text-black/80 hover:text-black transition-colors"
              aria-label="Search"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            {/* Connection status */}
            <div className="flex items-center gap-2 text-black/80">
              <span className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
              <span className="text-sm font-medium hidden sm:inline">{getStatusText()}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden flex items-center gap-1 pb-2 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1 text-sm font-medium text-black/80 hover:text-black whitespace-nowrap ${
                  isActive ? 'text-black border-b-2 border-black' : ''
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Search bar overlay */}
      {showSearch && (
        <div className="bg-black/90 py-4 px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchError('');
                }}
                placeholder="Search by Address / Transaction Hash / Momentum Height / ZTS"
                className={`w-full bg-[#1a1a1a] border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none font-mono text-sm ${
                  searchError ? 'border-red-500' : 'border-[#2a2a2a] focus:border-[#7fff00]'
                }`}
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#2a2a2a] rounded-lg hover:bg-[#3a3a3a] transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>
            {searchError && (
              <p className="mt-2 text-red-400 text-sm">{searchError}</p>
            )}
          </form>
        </div>
      )}
    </header>
  );
}
