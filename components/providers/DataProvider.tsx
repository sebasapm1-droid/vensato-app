"use client";

import { useVensatoData } from "@/lib/hooks/useVensatoData";
import { useAppStore } from "@/lib/store/app-store";

function AppSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 bg-vensato-border-subtle rounded-lg" />
        <div className="h-4 w-72 bg-vensato-border-subtle rounded-lg" />
      </div>
      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-vensato-surface border border-vensato-border-subtle rounded-xl" />
        ))}
      </div>
      {/* Table skeleton */}
      <div className="bg-vensato-surface border border-vensato-border-subtle rounded-xl overflow-hidden">
        <div className="h-12 border-b border-vensato-border-subtle bg-vensato-base" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 border-b border-vensato-border-subtle last:border-0 px-6 flex items-center gap-4">
            <div className="h-4 w-32 bg-vensato-border-subtle rounded" />
            <div className="h-4 w-24 bg-vensato-border-subtle rounded" />
            <div className="h-4 w-20 bg-vensato-border-subtle rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  useVensatoData();
  const isLoading = useAppStore(s => s.isLoading);

  if (isLoading) return <AppSkeleton />;
  return <>{children}</>;
}
