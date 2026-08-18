import React, { useState } from 'react';
import { Menu, X, BarChart2, Layers, Download, Lock, Sparkles, ShieldCheck, RefreshCw, Zap } from 'lucide-react';
import { useSalesStore } from '../../store/useSalesStore';

export type ActiveTab = 'landing' | 'dashboard' | 'myntra-editor' | 'export' | 'admin';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  totalRecordsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  totalRecordsCount
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAdminLoggedIn, dynoSyncStatus, syncWithDynoDatabase } = useSalesStore();

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const handleDynoSync = async () => {
    await syncWithDynoDatabase();
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleNavClick('landing')}>
            <img src="/favicon.png" alt="Sales Analytics Logo" className="h-9 w-9 rounded-xl object-contain shadow-xs hover:scale-105 transition-transform" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base text-slate-900 tracking-tight">Sales Analytics</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 font-semibold border border-sky-200">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Multi-Marketplace Sheet Engine</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100/80 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => handleNavClick('landing')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'landing'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Overview
            </button>

            <button
              onClick={() => handleNavClick('dashboard')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white text-sky-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Sales Dashboard
            </button>

            <button
              onClick={() => handleNavClick('myntra-editor')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'myntra-editor'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Style Counts
            </button>

            <button
              onClick={() => handleNavClick('export')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'export'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Export Sheets
            </button>

            <button
              onClick={() => handleNavClick('admin')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'admin'
                  ? 'bg-white text-sky-800 font-bold shadow-xs border border-slate-200'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-sky-600" />
              <span>Admin</span>
            </button>
          </nav>

          {/* Right Action */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            
            {/* Dyno Database Live Sync Button */}
            <button
              onClick={handleDynoSync}
              disabled={dynoSyncStatus.isSyncing}
              title={dynoSyncStatus.lastSyncTime ? `Dyno DB Connected. Last synced at ${dynoSyncStatus.lastSyncTime} (${dynoSyncStatus.syncedFilesCount} files)` : 'Sync with Dyno Dashboard Supabase DB'}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center space-x-1.5 shadow-xs ${
                dynoSyncStatus.isSyncing 
                  ? 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse' 
                  : dynoSyncStatus.error 
                    ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100' 
                    : 'bg-purple-50 hover:bg-purple-100 active:scale-98 text-purple-700 border-purple-200'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${dynoSyncStatus.isSyncing ? 'animate-spin text-amber-600' : 'text-purple-600'}`} />
              <span className="hidden sm:inline">
                {dynoSyncStatus.isSyncing ? 'Syncing Dyno DB...' : dynoSyncStatus.lastSyncTime ? `Dyno Synced (${dynoSyncStatus.lastSyncTime})` : 'Sync Dyno DB'}
              </span>
              <span className="sm:hidden">
                {dynoSyncStatus.isSyncing ? 'Syncing...' : 'Sync'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </button>

            <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-100 border border-slate-200 text-xs text-slate-700 font-mono font-medium">
              <span>Records:</span>
              <strong className="text-slate-900">{totalRecordsCount}</strong>
            </div>

            <button
              onClick={() => handleNavClick('admin')}
              className={`px-3.5 sm:px-4 py-2 rounded-lg font-semibold text-xs shadow-xs transition-all flex items-center space-x-1.5 ${
                isAdminLoggedIn
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {isAdminLoggedIn ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" /> : <Lock className="w-3.5 h-3.5 text-slate-300" />}
              <span>{isAdminLoggedIn ? 'Admin Portal' : 'Admin Login'}</span>
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Navigation Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-1 shadow-lg">
          <button
            onClick={() => handleNavClick('landing')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center space-x-2.5 ${
              activeTab === 'landing' ? 'bg-sky-50 text-sky-700 font-extrabold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => handleNavClick('dashboard')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center space-x-2.5 ${
              activeTab === 'dashboard' ? 'bg-sky-50 text-sky-700 font-extrabold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Sales Dashboard</span>
          </button>

          <button
            onClick={() => handleNavClick('myntra-editor')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center space-x-2.5 ${
              activeTab === 'myntra-editor' ? 'bg-sky-50 text-sky-700 font-extrabold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Style Counts</span>
          </button>

          <button
            onClick={() => handleNavClick('export')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center space-x-2.5 ${
              activeTab === 'export' ? 'bg-sky-50 text-sky-700 font-extrabold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Export Sheets</span>
          </button>

          <button
            onClick={() => handleNavClick('admin')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center space-x-2.5 ${
              activeTab === 'admin' ? 'bg-sky-50 text-sky-700 font-extrabold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Lock className="w-4 h-4 text-sky-600" />
            <span>Admin</span>
          </button>
        </div>
      )}
    </header>
  );
};
