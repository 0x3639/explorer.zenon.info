interface StatusBadgeProps {
  status: 'online' | 'offline';
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const isOnline = status === 'online';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]} ${
        isOnline
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
          : 'bg-red-500/20 text-red-400 border border-red-500/30'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'
        }`}
      />
      {isOnline ? 'Online' : 'Offline'}
    </span>
  );
}
