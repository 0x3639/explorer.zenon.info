import { StatusBadge } from './StatusBadge';
import type { BridgeStatus } from '@/types/zenon';

interface BridgeSummaryProps {
  data: BridgeStatus | null;
  loading?: boolean;
}

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  loading?: boolean;
}

function StatCard({ label, value, loading }: StatCardProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-4">
      <div className="text-gray-400 text-sm mb-1">{label}</div>
      {loading ? (
        <div className="h-7 bg-[#2a2a2a] rounded animate-pulse w-16" />
      ) : (
        <div className="text-white text-xl font-semibold">{value}</div>
      )}
    </div>
  );
}

export function BridgeSummary({ data, loading }: BridgeSummaryProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <StatCard
        label="Bridge Status"
        loading={loading}
        value={
          data ? (
            <StatusBadge status={data.bridge_status} size="md" />
          ) : (
            '-'
          )
        }
      />
      <StatCard
        label="Total Orchestrators"
        loading={loading}
        value={data?.total_count ?? '-'}
      />
      <StatCard
        label="Online"
        loading={loading}
        value={
          <span className="text-green-400">{data?.online_count ?? '-'}</span>
        }
      />
      <StatCard
        label="Offline"
        loading={loading}
        value={
          <span className="text-red-400">
            {data ? data.total_count - data.online_count : '-'}
          </span>
        }
      />
      <StatCard
        label="Query Time"
        loading={loading}
        value={data ? `${data.query_time_seconds}s` : '-'}
      />
    </div>
  );
}
