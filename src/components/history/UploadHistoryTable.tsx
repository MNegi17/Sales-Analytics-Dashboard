import React, { useState } from 'react';
import { useSalesStore } from '../../store/useSalesStore';
import { MARKETPLACE_CONFIGS } from '../../engine/constants';
import { Trash2, AlertCircle } from 'lucide-react';

export const UploadHistoryTable: React.FC = () => {
  const { uploadLogs, deleteUploadLog, isAdminLoggedIn } = useSalesStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteUploadLog(id);
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="clean-panel p-5 rounded-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Upload Audit History</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit logs of processed sales reports and file ingestion executions
          </p>
        </div>

        <div className="text-xs font-semibold px-3 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700">
          Total Uploads: <strong>{uploadLogs.length}</strong>
        </div>
      </div>

      {/* History Table */}
      <div className="clean-panel rounded-xl overflow-hidden">
        {uploadLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No upload history recorded yet. Upload a sales file to generate audit entries.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">File Name &amp; Time</th>
                  <th className="py-3 px-4">Marketplaces</th>
                  <th className="py-3 px-4">Date Range</th>
                  <th className="py-3 px-4 text-right">Processed Rows</th>
                  <th className="py-3 px-4 text-right">Inserted / Updated</th>
                  <th className="py-3 px-4 text-right">Duplicates / Errors</th>
                  <th className="py-3 px-4 text-right">Duration</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  {isAdminLoggedIn && <th className="py-3 px-4 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white font-mono">
                {uploadLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{log.fileName}</div>
                      <div className="text-[11px] text-slate-500">{log.uploadTimestamp}</div>
                    </td>

                    <td className="py-3 px-4 font-sans">
                      <div className="flex flex-wrap gap-1">
                        {log.marketplacesDetected.map(mp => (
                          <span 
                            key={mp} 
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 border border-slate-200 text-slate-700"
                          >
                            {MARKETPLACE_CONFIGS[mp]?.name || mp}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-700">
                      {log.dateRange}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {log.rowsProcessed}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className="text-emerald-700 font-bold">{log.rowsInserted}</span> / <span className="text-blue-700 font-bold">{log.rowsUpdated}</span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className="text-amber-700">{log.duplicateCount}</span> / <span className="text-rose-700">{log.errorCount}</span>
                    </td>

                    <td className="py-3 px-4 text-right text-slate-500">
                      {log.processingTimeMs} ms
                    </td>

                    <td className="py-3 px-4 text-center font-sans">
                      {log.status === 'SUCCESS' ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          SUCCESS
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                          {log.status}
                        </span>
                      )}
                    </td>

                    {isAdminLoggedIn && (
                      <td className="py-3 px-4 text-center font-sans">
                        <button
                          onClick={() => handleDelete(log.id)}
                          disabled={deletingId === log.id}
                          className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-[11px] transition-colors flex items-center justify-center space-x-1 mx-auto"
                          title="Delete this upload batch log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
