import React from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';

interface Props {
  isOffline: boolean;
}

export const OfflineBanner: React.FC<Props> = ({ isOffline }) => {
  if (!isOffline) return null;

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-md">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 animate-pulse" />
        <span>Network connection disrupted. POS Local Session Guard active: Cart and shift are preserved locally.</span>
      </div>
      <div className="flex items-center gap-1 bg-amber-600/30 px-2 py-0.5 rounded text-[11px]">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>Offline Safe Mode</span>
      </div>
    </div>
  );
};
