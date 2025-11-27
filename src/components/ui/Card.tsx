import Link from 'next/link';

interface CardProps {
  title: string;
  icon?: React.ReactNode;
  viewAllHref?: string;
  children: React.ReactNode;
}

export function Card({ title, icon, viewAllHref, children }: CardProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          {icon && <span className="text-gray-400">{icon}</span>}
          <h2 className="text-white font-medium">{title}</h2>
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-[#7fff00] text-sm font-medium hover:underline"
          >
            View All
          </Link>
        )}
      </div>
      <div className="divide-y divide-[#2a2a2a]">{children}</div>
    </div>
  );
}
