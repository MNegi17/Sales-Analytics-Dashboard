import React, { useState } from 'react';
import { Menu, X, Upload, BarChart2, Layers, Download, History, Sparkles } from 'lucide-react';

export type ActiveTab = 'landing' | 'dashboard' | 'upload' | 'myntra-editor' | 'export' | 'history';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenUploadModal: () => void;
  totalRecordsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenUploadModal,
  totalRecordsCount
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleNavClick('landing')}>
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-600 to-emerald-600 flex items-center justify-center text-white font-black text-sm tracking-tighter shadow-sm">
              SA
            </div>
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
              onClick={() => handleNavClick('history')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Audit History
            </button>
          </nav>

          {/* Right Action */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-100 border border-slate-200 text-xs text-slate-700 font-mono font-medium">
              <span>Records:</span>
              <strong className="text-slate-900">{totalRecordsCount}</strong>
            </div>

            <button
              onClick={onOpenUploadModal}
              className="px-3.5 sm:px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-xs transition-all flex items-center space-x-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Sales File</span>
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
            onClick={() => handleNavClick('history')}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center space-x-2.5 ${
              activeTab === 'history' ? 'bg-sky-50 text-sky-700 font-extrabold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit History</span>
          </button>
        </div>
      )}
    </header>
  );
};
