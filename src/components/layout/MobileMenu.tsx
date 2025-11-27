'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: { href: string; label: string }[];
}

export function MobileMenu({ isOpen, onClose, navItems }: MobileMenuProps) {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Close when clicking outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 md:hidden"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 transition-opacity" />

      {/* Slide-out menu */}
      <div
        ref={menuRef}
        className="fixed inset-y-0 left-0 w-64 bg-[#1a1a1a] border-r border-[#2a2a2a] transform transition-transform duration-300 ease-out"
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
          <span className="text-[#7fff00] font-bold text-lg">Zenon Explorer</span>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation items */}
        <nav className="p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-[#7fff00]/10 text-[#7fff00] border-l-2 border-[#7fff00]'
                        : 'text-gray-300 hover:bg-[#2a2a2a] hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
