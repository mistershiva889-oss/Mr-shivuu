import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall.ts';
import { Download, Share, PlusSquare, X, Smartphone, CheckCircle, Copy, Check, ExternalLink, Package } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'banner';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running as installed standalone PWA, hide install prompt unless clicked
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      await install();
      setIsInstalling(false);
    } else {
      setShowGuide(true);
    }
  };

  if (variant === 'banner') {
    return (
      <>
        <div className={`p-3 bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-950 border border-rose-500/25 rounded-2xl flex items-center justify-between gap-3 shadow-lg ${className}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 p-0.5 shadow-md shrink-0 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">StreamVibe App Install Karein</h4>
              <p className="text-[11px] text-slate-400 truncate">Home screen par add karke fast open karein</p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isInstalling ? 'Installing...' : 'Install'}</span>
          </button>
        </div>

        {/* Modal Guide */}
        {showGuide && (
          <InstallGuideModal onClose={() => setShowGuide(false)} isIOS={isIOS} />
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        disabled={isInstalling}
        title="App Install Karein (PWA & Stores)"
        aria-label="Install App"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-rose-600/15 hover:bg-rose-600/25 active:scale-95 text-rose-400 border border-rose-500/30 transition-all cursor-pointer ${className}`}
      >
        <Download className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
        <span className="hidden sm:inline">Install App</span>
      </button>

      {/* Guide Modal */}
      {showGuide && (
        <InstallGuideModal onClose={() => setShowGuide(false)} isIOS={isIOS} />
      )}
    </>
  );
};

interface InstallGuideModalProps {
  onClose: () => void;
  isIOS: boolean;
}

const MANIFEST_JSON_TEXT = JSON.stringify({
  id: "/",
  name: "StreamVibe - Video Streaming",
  short_name: "StreamVibe",
  description: "Mobile-first video streaming application with clean in-card player, landscape rotation, and high-definition video playback.",
  start_url: "/",
  scope: "/",
  display: "standalone",
  display_override: ["standalone", "window-controls-overlay", "minimal-ui"],
  orientation: "any",
  theme_color: "#0a0d14",
  background_color: "#0a0d14",
  lang: "en",
  dir: "ltr",
  categories: ["entertainment", "video", "multimedia"],
  icons: [
    { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/pwa-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png", purpose: "any" },
    { src: "/icon.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" }
  ],
  screenshots: [
    { src: "/screenshot-mobile.png", sizes: "390x844", type: "image/png", form_factor: "narrow", label: "Mobile Video Feed & In-Card Player" },
    { src: "/screenshot-desktop.png", sizes: "800x450", type: "image/png", form_factor: "wide", label: "Full Screen Video Streaming View" }
  ]
}, null, 2);

const InstallGuideModal: React.FC<InstallGuideModalProps> = ({ onClose, isIOS }) => {
  const [activeTab, setActiveTab] = useState<'install' | 'pwabuilder'>('install');
  const [copied, setCopied] = useState(false);

  const handleCopyManifest = () => {
    navigator.clipboard.writeText(MANIFEST_JSON_TEXT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-[#0e131f] border border-slate-700/80 p-5 shadow-2xl text-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white font-bold text-sm shadow">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">StreamVibe PWA & Store</h3>
              <p className="text-[11px] text-slate-400">Install App & PWABuilder Guide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl mt-3 border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('install')}
            className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
              activeTab === 'install'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Phone Install Guide
          </button>
          <button
            onClick={() => setActiveTab('pwabuilder')}
            className={`flex-1 py-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'pwabuilder'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>PWABuilder / Play Store</span>
          </button>
        </div>

        {activeTab === 'install' ? (
          isIOS ? (
            <div className="mt-4 space-y-3 text-xs">
              <p className="text-slate-300">
                iPhone ya iPad par app install karne ke liye:
              </p>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-start gap-2.5">
                <Share className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>1. Safari toolbar me <strong>Share button</strong> tap karein.</span>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-start gap-2.5">
                <PlusSquare className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>2. Neeche scroll karke <strong>Add to Home Screen</strong> par tap karein.</span>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3 text-xs">
              <p className="text-slate-300">
                Chrome ya Mobile Browser par install karne ke liye:
              </p>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-start gap-2.5">
                <Download className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>1. Browser ke <strong>URL box / address bar</strong> me right side <strong>Install</strong> icon par click karein.</span>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>2. Ya phir browser menu (⋮) kholkar <strong>Install App</strong> / <strong>Add to Home Screen</strong> select karein.</span>
              </div>
            </div>
          )
        ) : (
          <div className="mt-4 space-y-3.5 text-xs">
            {/* 512x512 Icon Section specifically for PWABuilder */}
            <div className="p-3 bg-slate-900/90 rounded-2xl border border-rose-500/30">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-black/50 border border-slate-700/80 p-1 shrink-0 overflow-hidden shadow-md">
                  <img
                    src="/pwa-512x512.png"
                    alt="StreamVibe 512x512 Icon"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-white text-xs">PWABuilder 512x512 Icon</h4>
                  <p className="text-[11px] text-slate-400">PNG Format · 512×512 · Store Ready</p>
                  <a
                    href="/download-icon"
                    download="streamvibe-512x512.png"
                    className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download 512x512 Icon</span>
                  </a>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-800 text-[11px] text-slate-300 space-y-1">
                <p>1. Upar <strong>Download 512x512 Icon</strong> par tap karke save karein.</p>
                <p>2. PWABuilder me jo <strong>Upload</strong> button dikh raha hai uspe tap karein aur is image ko select karein.</p>
              </div>
            </div>

            {/* Manifest JSON Copy Helper */}
            <div className="relative">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Manifest JSON (Store Ready):</span>
                <button
                  onClick={handleCopyManifest}
                  className="flex items-center gap-1 text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre className="p-2.5 bg-black/60 rounded-xl border border-slate-800 text-[10px] text-slate-300 font-mono max-h-28 overflow-y-auto overflow-x-auto">
                {MANIFEST_JSON_TEXT}
              </pre>
            </div>

            <button
              onClick={handleCopyManifest}
              className="w-full py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Manifest JSON'}</span>
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 font-semibold text-xs text-slate-300 rounded-xl transition cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};
