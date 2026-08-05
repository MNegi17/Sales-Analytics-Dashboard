import React, { useState } from 'react';
import { useSalesStore } from '../../store/useSalesStore';
import confetti from 'canvas-confetti';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose }) => {
  const { 
    processUploadedFile, 
    isProcessing, 
    activeConflict, 
    applyDuplicateResolution 
  } = useSalesStore();

  const [dragActive, setDragActive] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f.name.endsWith('.xlsx') || f.name.endsWith('.xls'));
    if (fileArray.length === 0) {
      setLastMessage('Please select valid Excel files (.xlsx)');
      return;
    }

    for (const file of fileArray) {
      const result = await processUploadedFile(file);
      if (result.success) {
        setLastMessage(result.message || 'File processed successfully!');
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } else if (result.conflict) {
        // Conflict modal shows automatically
      } else {
        setLastMessage(result.message || 'Processing failed');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white p-6 rounded-xl border border-slate-200 shadow-xl space-y-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Upload Sales File</h2>
            <p className="text-xs text-slate-500">Supports single or bulk multi-day sales report Excel files</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* DUPLICATE CONFLICT DIALOG */}
        {activeConflict ? (
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 space-y-3">
            <div>
              <h4 className="font-bold text-amber-900 text-sm">Duplicate Data Detected</h4>
              <p className="text-xs text-amber-800">
                Sales entries for date <strong>{activeConflict.dateKey}</strong> already exist.
              </p>
            </div>

            <p className="text-xs text-slate-700">Select duplicate resolution action:</p>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                onClick={() => applyDuplicateResolution('replace')}
                className="px-3 py-2 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                Replace
              </button>

              <button
                onClick={() => applyDuplicateResolution('merge')}
                className="px-3 py-2 rounded bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs"
              >
                Merge
              </button>

              <button
                onClick={() => applyDuplicateResolution('skip')}
                className="px-3 py-2 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs"
              >
                Skip
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Drag & Drop Box */}
            <div
              onDragOver={e => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={e => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
              }}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                dragActive 
                  ? 'border-brand-600 bg-brand-50' 
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50'
              }`}
            >
              <input
                type="file"
                accept=".xlsx, .xls"
                multiple
                className="hidden"
                id="file-upload-input"
                onChange={e => e.target.files && handleFiles(e.target.files)}
              />

              <label htmlFor="file-upload-input" className="cursor-pointer space-y-3 block">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">
                    {isProcessing ? 'Processing Sales Data...' : 'Drop your Sales Excel file here'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Supports `.xlsx` files with single or consecutive days
                  </p>
                </div>

                <div className="inline-block px-4 py-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-800 shadow-xs">
                  Browse Files
                </div>
              </label>
            </div>

            {/* Status Message */}
            {lastMessage && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
                ✓ {lastMessage}
              </div>
            )}
          </>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-end border-t border-slate-200 pt-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
