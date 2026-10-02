import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { api } from '../../services/api.ts';
import { ChangePasswordModal } from './ChangePasswordModal.tsx';
import {
  Save,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Shield,
  FileText,
  Smartphone,
  KeyRound,
} from 'lucide-react';

export const AppSettingsView: React.FC = () => {
  const { settings, refreshSettings } = useApp();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const [appName, setAppName] = useState(settings?.appName || 'StreamVibe');
  const [appLogo, setAppLogo] = useState(
    settings?.appLogo || '/src/assets/images/app_brand_logo_1790671540965.jpg'
  );
  const [tagline, setTagline] = useState(settings?.tagline || 'Watch & Enjoy');
  const [maintenanceMode, setMaintenanceMode] = useState(
    settings?.maintenanceMode || false
  );
  const [termsAndPrivacy, setTermsAndPrivacy] = useState(
    settings?.termsAndPrivacy || ''
  );

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await api.updateAdminSettings({
        appName: appName.trim(),
        appLogo: appLogo.trim(),
        tagline: tagline.trim(),
        maintenanceMode,
        termsAndPrivacy: termsAndPrivacy.trim(),
      });
      await refreshSettings();
      setSuccessMessage('Application settings updated and synced to all mobile clients.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Application Configuration & Global Policy
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Centralized brand, maintenance lockout, and regulatory copy.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Brand & Identity Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0d1019] border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Smartphone className="w-4 h-4 text-rose-500" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Brand & Welcome Screen
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                App Name
              </label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                required
                className="w-full h-11 px-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Welcome Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Watch & Enjoy"
                required
                className="w-full h-11 px-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Logo Asset URL
            </label>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                <img
                  src={appLogo}
                  alt="Logo preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <input
                type="text"
                value={appLogo}
                onChange={(e) => setAppLogo(e.target.value)}
                required
                className="flex-1 h-11 px-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>
        </div>

        {/* Maintenance Mode Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0d1019] border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Shield className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Emergency & Maintenance Guard
            </h2>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="space-y-0.5 max-w-lg">
              <span className="text-sm font-semibold text-white block">
                Platform Maintenance Mode
              </span>
              <p className="text-xs text-slate-400">
                When toggled ON, standard mobile users see a maintenance screen. Administrators continue to have unrestricted console access.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600" />
            </label>
          </div>
        </div>

        {/* Terms & Privacy Copy */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0d1019] border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <FileText className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Legal & Privacy Policy Disclosures
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Terms & Privacy Copy
            </label>
            <textarea
              rows={4}
              value={termsAndPrivacy}
              onChange={(e) => setTermsAndPrivacy(e.target.value)}
              className="w-full p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 leading-relaxed font-mono"
            />
          </div>
        </div>

        {/* Security & Password Change Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0e121e] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-rose-500" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Administrator Security & Password
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-rose-600/20 text-rose-400 hover:text-white hover:bg-rose-600 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Change Password</span>
            </button>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Update your master administrative password to keep the dashboard secure from unauthorized access.
          </p>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-rose-950/40 cursor-pointer disabled:opacity-50 transition-colors"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save App Configuration</span>
          </button>
        </div>
      </form>

      {/* Admin Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};
