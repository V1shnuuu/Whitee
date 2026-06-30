// ─────────────────────────────────────────────────────────────
// CredVault – Loading Skeleton for Transaction History
// ─────────────────────────────────────────────────────────────

'use client';

export default function TransactionSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-700/30 animate-pulse"
        >
          {/* Skill icon placeholder */}
          <div className="w-10 h-10 rounded-lg bg-slate-700/50" />

          {/* Text content */}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-700/50 rounded w-32" />
            <div className="h-3 bg-slate-700/30 rounded w-48" />
          </div>

          {/* Amount placeholder */}
          <div className="h-5 bg-slate-700/40 rounded w-16" />
        </div>
      ))}
    </div>
  );
}
