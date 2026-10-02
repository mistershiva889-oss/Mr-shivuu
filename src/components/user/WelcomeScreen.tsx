import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useApp } from '../../context/AppContext.tsx';
import { api } from '../../services/api.ts';
import {
  Play,
  Sparkles,
  Smartphone,
  User,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface WelcomeScreenProps {
  onSuccess?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSuccess }) => {
  const { login } = useAuth();
  const { settings } = useApp();

  const [mobileNumber, setMobileNumber] = useState(() => {
    return localStorage.getItem('streamvibe_last_mobile') || '';
  });
  const [name, setName] = useState(() => {
    return localStorage.getItem('streamvibe_last_name') || '';
  });

  const [existingUser, setExistingUser] = useState<{ id: string; name: string; mobileNumber: string } | null>(null);
  const [isCheckingMobile, setIsCheckingMobile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check mobile number whenever user types/changes it
  useEffect(() => {
    const digitsOnly = mobileNumber.replace(/\D/g, '');
    if (digitsOnly.length >= 10) {
      let isMounted = true;
      setIsCheckingMobile(true);
      api
        .checkMobile(digitsOnly)
        .then((res) => {
          if (!isMounted) return;
          if (res.exists && res.user) {
            setExistingUser(res.user);
            setName(res.user.name);
          } else {
            setExistingUser(null);
          }
        })
        .catch(() => {
          if (isMounted) setExistingUser(null);
        })
        .finally(() => {
          if (isMounted) setIsCheckingMobile(false);
        });

      return () => {
        isMounted = false;
      };
    } else {
      setExistingUser(null);
    }
  }, [mobileNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanMobile = mobileNumber.trim();
    const digitsOnly = cleanMobile.replace(/\D/g, '');

    if (!digitsOnly || digitsOnly.length < 7 || digitsOnly.length > 15) {
      setError('Please enter a valid mobile number (7 to 15 digits).');
      return;
    }

    let cleanName = name.trim();
    // If returning user, use existing name
    if (existingUser) {
      cleanName = existingUser.name;
    } else if (!cleanName || cleanName.length < 2) {
      // New user requires name
      setError('Please enter your full name (minimum 2 characters).');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(cleanName, cleanMobile);
      localStorage.setItem('streamvibe_last_mobile', cleanMobile);
      localStorage.setItem('streamvibe_last_name', cleanName);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Unable to start session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const appName = settings?.appName || 'StreamVibe';
  const tagline = settings?.tagline || 'Watch & Enjoy';
  const appLogo = settings?.appLogo || '/src/assets/images/app_brand_logo_1790671540965.jpg';

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-between px-5 py-8 sm:py-12 select-none relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-12 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top spacing / status bar area */}
      <div className="w-full flex items-center justify-between z-10 pt-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-rose-500">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Mobile Streaming</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Instant Access</span>
        </div>
      </div>

      {/* Main Content Card / Form Container */}
      <div className="w-full max-w-md mx-auto my-auto z-10 flex flex-col items-center">
        {/* App Logo */}
        <div className="relative mb-5 group">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden shadow-2xl shadow-rose-950/40 ring-1 ring-white/10 relative p-1 bg-gradient-to-b from-slate-800 to-slate-900">
            <img
              src={appLogo}
              alt={appName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-2xl"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-rose-600/20 flex items-center justify-center backdrop-blur-xs">
                <Play className="w-5 h-5 text-rose-500 fill-rose-500 ml-0.5" />
              </div>
            </div>
          </div>
        </div>

        {/* App Name & Tagline */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white text-center font-['Plus_Jakarta_Sans',sans-serif]">
          {appName}
        </h1>
        <p className="mt-2 text-base sm:text-lg text-slate-400 text-center font-medium">
          {tagline}
        </p>

        {/* Error Banner */}
        {error && (
          <div className="w-full mt-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* The Single-Screen Form: Seamless 1-Number Login */}
        <form onSubmit={handleSubmit} className="w-full mt-7 space-y-4">
          {/* Mobile Number Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Mobile Number
              </label>
              {isCheckingMobile && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin text-rose-400" />
                  <span>Checking...</span>
                </span>
              )}
            </div>

            <div className="relative flex items-center">
              <div className="absolute left-3.5 pointer-events-none text-slate-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <input
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="e.g. 9876543210"
                disabled={isSubmitting}
                className="w-full h-12 pl-11 pr-4 bg-[#121622] border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors font-mono tabular-nums"
                autoComplete="tel"
                required
              />
            </div>

            {/* Recognized Returning User Banner */}
            {existingUser ? (
              <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2 text-emerald-400 text-xs font-medium animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>
                  Welcome back, <strong>{existingUser.name}</strong>! Tap below to stream.
                </span>
              </div>
            ) : (
              <p className="mt-1.5 text-[11px] text-slate-500">
                Ek baar register karein, uske baad usi number se hamesha direct login karein.
              </p>
            )}
          </div>

          {/* Name Field (Only shown if new user or editing name) */}
          {!existingUser && (
            <div className="animate-in fade-in duration-200">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Your Full Name
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  disabled={isSubmitting}
                  className="w-full h-12 pl-11 pr-4 bg-[#121622] border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          {/* Login / Get Started Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Logging in...</span>
                </div>
              ) : existingUser ? (
                <>
                  <span>Login as {existingUser.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Get Started & Watch</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

      </div>

      {/* Footer policy */}
      <div className="w-full text-center text-[11px] text-slate-600 z-10 pt-4">
        <span>Instant mobile sign in · No passwords needed · High speed stream</span>
      </div>
    </div>
  );
};
