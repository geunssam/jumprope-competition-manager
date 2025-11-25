import React from 'react';
import { useOnlineStatus } from '../utils/offlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
      <WifiOff size={18} />
      <span className="text-sm font-medium">오프라인 모드</span>
    </div>
  );
};
