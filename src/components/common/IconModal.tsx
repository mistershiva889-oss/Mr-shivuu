import React, { useState } from 'react';
import { Download, X, Image as ImageIcon, Check } from 'lucide-react';

interface IconModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IconModal: React.FC<IconModalProps> = ({ isOpen, onClose }) => {
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#0e1320] border border-rose-500/30 p-6 text-slate-100 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold mb-3">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>PWABuilder 512×512 Icon</span>
          </span>
          <h3 className="text-lg font-bold text-white mb-1">StreamVibe App Icon</h3>
          <p className="text-xs text-slate-400 mb-4">
            Is image ko download karein aur PWABuilder me <strong>Upload</strong> karein.
          </p>

          {/* Icon Preview */}
          <div className="w-36 h-36 mx-auto mb-4 p-1.5 rounded-3xl bg-black/60 border border-slate-700 shadow-xl overflow-hidden flex items-center justify-center">
            <img
              src="/pwa-512x512.png"
              alt="StreamVibe 512x512 Icon"
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>

          <p className="text-[11px] text-slate-400 mb-3">
            💡 <em>Tip: Agar download button kaam na kare, toh upar image par finger hold (long-press) karke <strong>Save image</strong> chunein.</em>
          </p>

          <a
            href="/download-icon"
            download="streamvibe-icon-512x512.png"
            onClick={() => setDownloaded(true)}
            className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-900/40 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {downloaded ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
            <span>{downloaded ? 'Downloaded! Ab PWABuilder me Upload karein' : 'Download 512x512 Icon'}</span>
          </a>

          <button
            onClick={onClose}
            className="mt-3 w-full py-2.5 bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
