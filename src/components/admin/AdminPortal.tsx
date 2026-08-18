import React, { useState } from 'react';
import { useSalesStore } from '../../store/useSalesStore';
import { AdminLoginForm } from './AdminLoginForm';
import { UploadHistoryTable } from '../history/UploadHistoryTable';
import { UploadModal } from '../upload/UploadModal';
import { ShieldCheck, Upload, LogOut, Database, FileSpreadsheet, RefreshCw, Zap, CheckCircle2 } from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const { 
    isAdminLoggedIn, 
    adminEmail, 
    logoutAdmin, 
    dynoSyncStatus, 
    syncWithDynoDatabase 
  } = useSalesStore();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  if (!isAdminLoggedIn) {
    return <AdminLoginForm />;
  }

  const handleSync = async (mode: 'live' | 'recent' | 'full') => {
    setSyncFeedback(null);
    const res = await syncWithDynoDatabase(mode);
    setSyncFeedback(res.message);
    setTimeout(() => setSyncFeedback(null), 6000);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Admin Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Authenticated System Admin</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Admin Management Portal</h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Logged in as: <strong className="text-sky-400 font-mono">{adminEmail}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Live Sync */}
          <button
            onClick={() => handleSync('live')}
            disabled={dynoSyncStatus.isSyncing}
            className="flex-1 md:flex-none px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5"
          >
            <Zap className={`w-3.5 h-3.5 ${dynoSyncStatus.isSyncing && dynoSyncStatus.activeMode === 'live' ? 'animate-bounce' : 'fill-white'}`} />
            <span>{dynoSyncStatus.isSyncing && dynoSyncStatus.activeMode === 'live' ? 'Live Syncing...' : 'Live Sync'}</span>
          </button>

          {/* Recent 5 Days Sync */}
          <button
            onClick={() => handleSync('recent')}
            disabled={dynoSyncStatus.isSyncing}
            className="flex-1 md:flex-none px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-98 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${dynoSyncStatus.isSyncing && dynoSyncStatus.activeMode === 'recent' ? 'animate-spin' : ''}`} />
            <span>{dynoSyncStatus.isSyncing && dynoSyncStatus.activeMode === 'recent' ? 'Checking 5D...' : '5-Day Sync'}</span>
          </button>

          {/* Manual Excel Upload */}
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex-1 md:flex-none px-3.5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-98 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>

          <button
            onClick={logoutAdmin}
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-98 text-slate-200 font-bold text-xs border border-white/20 transition-all flex items-center justify-center space-x-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>

      </div>

      {syncFeedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center space-x-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Dyno Database Pipeline Card */}
        <div className="clean-panel p-6 rounded-2xl border border-purple-200/80 bg-purple-50/20 shadow-xs space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Dyno DB Cloud Pipeline</h3>
              <p className="text-xs text-slate-500">Live Supabase Database Connection</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Pulls real-time Uniware orders and newly uploaded daily files directly into Railway PostgreSQL storage.
          </p>
          <div className="space-y-1.5 pt-1 text-[11px] font-mono">
            <div className="flex items-center justify-between text-slate-600">
              <span>Synced Files:</span>
              <strong className="text-purple-900">{dynoSyncStatus.syncedFilesCount}</strong>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Raw Records:</span>
              <strong className="text-purple-900">{dynoSyncStatus.totalRecordsSynced.toLocaleString()}</strong>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Last Synced:</span>
              <span className="text-slate-800 font-semibold">{dynoSyncStatus.lastSyncTime || 'Pending'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => handleSync('live')}
              disabled={dynoSyncStatus.isSyncing}
              className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition-all flex items-center justify-center space-x-1.5"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>Live Sync</span>
            </button>

            <button
              onClick={() => handleSync('recent')}
              disabled={dynoSyncStatus.isSyncing}
              className="py-2 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-[11px] shadow-xs transition-all flex items-center justify-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${dynoSyncStatus.isSyncing && dynoSyncStatus.activeMode === 'recent' ? 'animate-spin' : ''}`} />
              <span>5-Day Sync</span>
            </button>
          </div>

          <button
            onClick={() => handleSync('full')}
            disabled={dynoSyncStatus.isSyncing}
            className="w-full py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] border border-slate-200 transition-all flex items-center justify-center space-x-1"
          >
            <span>Full Catalog Historical Resync (All 228 Files)</span>
          </button>
        </div>

        {/* Upload Action Card */}
        <div className="clean-panel p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center font-bold">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Ingest Local Excel Report</h3>
              <p className="text-xs text-slate-500">Upload standalone sales Excel file</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            You can also drag-and-drop standalone daily or multi-day sales files directly if needed.
          </p>
          <div className="h-9" />
          <button
            onClick={() => setIsUploadOpen(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Open File Upload Workspace</span>
          </button>
        </div>

        {/* Batch Audit Management Card */}
        <div className="clean-panel p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Batch Ingestion Audit</h3>
              <p className="text-xs text-slate-500">Audit logs &amp; batch controls</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Review uploaded files below. You can delete specific ingestion batches individually from the Audit History table.
          </p>
          <div className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 flex items-center justify-between">
            <span>Granular Batch Deletion Enabled</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

      </div>

      {/* Audit History & Batch Deletion Table */}
      <UploadHistoryTable />

      {/* Upload Modal (triggered by admin) */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />

    </div>
  );
};
