import React from 'react';
import { WifiOff, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';

interface Props {
  isOffline: boolean;
  pendingCount?: number;
  isSyncing?: boolean;
  onSync?: () => void;
}

export const OfflineBanner: React.FC<Props> = ({
  isOffline,
  pendingCount = 0,
  isSyncing = false,
  onSync,
}) => {
  if (!isOffline && pendingCount === 0) return null;

  if (isOffline) {
    return (
      <div className="bg-amber-500 text-amber-950 px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>
            Network connection disrupted. POS Local Session Guard active: Cart, shift, and sales are preserved locally.
          </span>
          {pendingCount > 0 && (
            <span className="bg-amber-700 text-white font-mono px-2 py-0.5 rounded-full text-[10px]">
              {pendingCount} offline sale{pendingCount > 1 ? 's' : ''} queued
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 bg-amber-600/30 px-2 py-0.5 rounded text-[11px]">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Offline Safe Mode</span>
        </div>
      </div>
    );
  }

  // Back online with pending sales to sync
  return (
    <div className="bg-blue-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-md animate-fade-in">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
        <span>
          Connection restored! You have {pendingCount} offline sale{pendingCount > 1 ? 's' : ''} waiting to sync to Core.
        </span>
      </div>
      <button
        onClick={onSync}
        disabled={isSyncing}
        className="px-3 py-1 bg-white text-blue-700 font-bold rounded-lg hover:bg-blue-50 transition flex items-center gap-1.5 shadow-sm text-xs disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
        <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
      </button>
    </div>
  );
};
