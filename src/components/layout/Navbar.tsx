import React from 'react';

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
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('landing')}>
            <div className="h-9 w-9 rounded-lg bg-brand-600 flex items-center justify-center text-white font-black text-sm tracking-tighter">
              SA
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base text-slate-900 tracking-tight">Sales Automation</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Multi-Marketplace Sheet Engine</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100/80 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveTab('landing')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'landing'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Overview
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white text-brand-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Sales Dashboard
            </button>

            <button
              onClick={() => setActiveTab('myntra-editor')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'myntra-editor'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Style Counts
            </button>

            <button
              onClick={() => setActiveTab('export')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'export'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Export Sheets
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Audit History
            </button>
          </nav>

          {/* Right Action */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-100 border border-slate-200 text-xs text-slate-700 font-mono font-medium">
              <span>Records:</span>
              <strong className="text-slate-900">{totalRecordsCount}</strong>
            </div>

            <button
              onClick={onOpenUploadModal}
              className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm transition-all"
            >
              Upload Sales File
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
