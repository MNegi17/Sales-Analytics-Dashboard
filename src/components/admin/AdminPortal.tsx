import React, { useState } from 'react';
import { useSalesStore } from '../../store/useSalesStore';
import { AdminLoginForm } from './AdminLoginForm';
import { UploadHistoryTable } from '../history/UploadHistoryTable';
import { UploadModal } from '../upload/UploadModal';
import { ShieldCheck, Upload, LogOut, Database, FileSpreadsheet } from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const { isAdminLoggedIn, adminEmail, logoutAdmin } = useSalesStore();
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  if (!isAdminLoggedIn) {
    return <AdminLoginForm />;
  }

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

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-98 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload New Sales Report</span>
          </button>

          <button
            onClick={logoutAdmin}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-98 text-slate-200 font-bold text-xs border border-white/20 transition-all flex items-center justify-center space-x-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>

      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Upload Action Card */}
        <div className="clean-panel p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center font-bold">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Ingest Raw Sales Report</h3>
              <p className="text-xs text-slate-500">Upload new marketplace Excel files into PostgreSQL</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Data uploads are strictly restricted to this admin workspace to guarantee data integrity across all 7 marketplace dashboards.
          </p>
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
              <h3 className="text-sm font-bold text-slate-900">Batch Ingestion Audit &amp; Controls</h3>
              <p className="text-xs text-slate-500">Manage individual file upload logs</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Review uploaded files below. You can delete specific ingestion batches individually from the Audit History table to maintain precise data control.
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
