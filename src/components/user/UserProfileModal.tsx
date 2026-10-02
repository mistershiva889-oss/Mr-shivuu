import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { X, LogOut, User as UserIcon, Phone, ShieldCheck } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  if (!isOpen || !user) return null;

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal / Bottom Sheet */}
      <div className="relative w-full max-w-sm bg-[#111520] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 z-10 animate-in slide-in-from-bottom duration-200">
        {/* Drag handle affordance for mobile */}
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-4 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <h2 className="text-base font-bold text-white tracking-tight">User Profile</h2>
          <button
            onClick={onClose}
            aria-label="Close profile"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Details */}
        <div className="py-5 space-y-4">
          {/* Avatar representation */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-rose-950/40">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-base font-semibold text-white tracking-tight leading-snug">
                {user.name}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Streamer</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-xl bg-[#0c0f17] border border-slate-800/70 flex items-center gap-3">
              <UserIcon className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="overflow-hidden">
                <span className="block text-[11px] uppercase tracking-wider text-slate-400 font-medium">Name</span>
                <span className="text-sm font-medium text-slate-200 truncate block">{user.name}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0c0f17] border border-slate-800/70 flex items-center gap-3">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="overflow-hidden">
                <span className="block text-[11px] uppercase tracking-wider text-slate-400 font-medium">Mobile Number</span>
                <span className="text-sm font-medium text-slate-200 font-mono tabular-nums truncate block">
                  {user.mobileNumber}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="pt-2">
          <button
            onClick={handleLogout}
            className="w-full h-11 rounded-xl bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-900 border border-slate-700/80 text-slate-200 font-medium text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
