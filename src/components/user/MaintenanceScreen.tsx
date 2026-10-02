import React from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';

interface MaintenanceScreenProps {
  onAdminLogin: () => void;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({ onAdminLogin }) => {
  const { settings } = useApp();

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 shadow-xl shadow-amber-950/20">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
        {settings?.appName || 'StreamVibe'} is in Maintenance Mode
      </h1>

      <p className="text-sm text-slate-400 max-w-sm mb-4 leading-relaxed">
        We are currently upgrading our cloud streaming infrastructure and caching nodes. The feed will return online shortly.
      </p>
    </div>
  );
};
