import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext.tsx';
import { WelcomeScreen } from './components/user/WelcomeScreen.tsx';
import { UserHomeScreen } from './components/user/UserHomeScreen.tsx';
import { MaintenanceScreen } from './components/user/MaintenanceScreen.tsx';
import { AdminLogin } from './components/admin/AdminLogin.tsx';
import { AdminLayout } from './components/admin/AdminLayout.tsx';
import { Smartphone, Monitor } from 'lucide-react';

function MainApp() {
  const { settings, isLoading: isAppLoading } = useApp();
  const { isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const { isAdminLoggedIn, isLoading: isAdminLoading } = useAdminAuth();

  // Mode: 'user' or 'admin'
  const [currentPortal, setCurrentPortal] = useState<'user' | 'admin'>('user');
  
  // Desktop preview simulator state (mobile bezel vs full width)
  const [isSimulatedMobile, setIsSimulatedMobile] = useState(true);

  // Check URL hash for direct admin routing e.g. #admin
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash.toLowerCase().includes('admin')) {
        setCurrentPortal('admin');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  if (isAppLoading || isAuthLoading || isAdminLoading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium tracking-wide">Initializing StreamVibe...</span>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // ADMIN PORTAL
  // ---------------------------------------------------------------------------
  if (currentPortal === 'admin') {
    if (!isAdminLoggedIn) {
      return (
        <AdminLogin
          onBackToApp={() => {
            window.location.hash = '';
            setCurrentPortal('user');
          }}
        />
      );
    }
    return (
      <AdminLayout
        onBackToUserApp={() => {
          window.location.hash = '';
          setCurrentPortal('user');
        }}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // USER APP PORTAL
  // ---------------------------------------------------------------------------
  // If maintenance mode is active, show maintenance notice
  if (settings?.maintenanceMode) {
    return (
      <MaintenanceScreen
        onAdminLogin={() => {
          window.location.hash = 'admin';
          setCurrentPortal('admin');
        }}
      />
    );
  }

  const renderUserContent = () => {
    if (!isLoggedIn) {
      return <WelcomeScreen />;
    }
    return (
      <UserHomeScreen
        onSwitchToAdmin={() => {
          window.location.hash = 'admin';
          setCurrentPortal('admin');
        }}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#04060a] flex flex-col items-center justify-center">
      {/* Top Device Frame Switcher Toolbar (Hidden on actual mobile screens) */}
      <div className="hidden lg:flex fixed top-3 right-4 z-50 items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-800 text-xs shadow-lg">
        <span className="text-slate-400 text-[11px] font-medium mr-1">Preview:</span>
        <button
          onClick={() => setIsSimulatedMobile(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer ${
            isSimulatedMobile
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Mobile (390px)</span>
        </button>
        <button
          onClick={() => setIsSimulatedMobile(false)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer ${
            !isSimulatedMobile
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Responsive</span>
        </button>
      </div>

      {/* Main Viewport Container */}
      {isSimulatedMobile ? (
        <div className="w-full lg:max-w-[430px] min-h-screen lg:min-h-[850px] lg:my-8 bg-[#07090e] lg:rounded-[40px] lg:ring-1 lg:ring-slate-700/80 lg:shadow-2xl flex flex-col relative overflow-x-hidden">
          {/* Simulated Mobile Status Notch only on large desktop preview */}
          <div className="hidden lg:flex items-center justify-between px-6 pt-3 pb-1 bg-[#0a0d14] text-[11px] text-slate-400 select-none z-40">
            <span className="font-mono font-medium">9:41</span>
            <div className="w-20 h-4 bg-black rounded-full" />
            <div className="flex items-center gap-1">
              <span>5G</span>
              <div className="w-4 h-2 rounded-xs border border-slate-400 p-0.5">
                <div className="w-full h-full bg-slate-400 rounded-2xs" />
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col w-full">
            {renderUserContent()}
          </div>
        </div>
      ) : (
        <div className="w-full min-h-screen bg-[#07090e] flex flex-col overflow-x-hidden">
          {renderUserContent()}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <AdminAuthProvider>
          <MainApp />
        </AdminAuthProvider>
      </AuthProvider>
    </AppProvider>
  );
}
