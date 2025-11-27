interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] py-3 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto flex items-center gap-2">
        <h1 className="text-white text-sm font-medium">{title}</h1>
        {subtitle && (
          <>
            <span className="text-gray-600">|</span>
            <span className="text-[#7fff00] text-sm font-medium">{subtitle}</span>
          </>
        )}
      </div>
    </div>
  );
}
