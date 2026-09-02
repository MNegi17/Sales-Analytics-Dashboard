import React, { useState } from 'react';
import { useSalesStore } from '../../store/useSalesStore';
import { generateMonthlyExcelWorkbook } from '../../engine/exporter';
import { MARKETPLACE_CONFIGS, getCurrentISTMonthYear, getDefaultMonths } from '../../engine/constants';
import { MarketplaceId } from '../../types';

export const ExportModule: React.FC = () => {
  const { dailyStats, myntraStyleCounts, selectedMonthYear, customMonths } = useSalesStore();

  const [selectedMp, setSelectedMp] = useState<MarketplaceId>('myntra');
  const [targetMonthYear, setTargetMonthYear] = useState<string>(selectedMonthYear || getCurrentISTMonthYear());
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  const availableMonthsSet = new Set<string>(customMonths);
  getDefaultMonths().forEach(m => availableMonthsSet.add(m));
  availableMonthsSet.add(getCurrentISTMonthYear());
  dailyStats.forEach(s => availableMonthsSet.add(s.monthYearKey));
  const availableMonths = Array.from(availableMonthsSet);

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const filteredStats = dailyStats.filter(
        s => s.monthYearKey === targetMonthYear && s.marketplaceId === selectedMp
      );

      const buffer = await generateMonthlyExcelWorkbook(
        selectedMp,
        targetMonthYear,
        filteredStats,
        myntraStyleCounts
      );

      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanMpName = MARKETPLACE_CONFIGS[selectedMp].name.replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `${cleanMpName}_${targetMonthYear.replace(/\s+/g, '_')}_Monthly_Sheet.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccessMsg(`Successfully exported ${cleanMpName} monthly sheet!`);
      setTimeout(() => setExportSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="clean-panel p-6 rounded-xl text-center space-y-2">
        <h2 className="text-xl font-bold text-slate-900">Download Excel Sheets</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Export monthly Excel workbooks matching your Google Sheet layout, category order, and formulas.
        </p>
      </div>

      {/* Export Controls */}
      <div className="clean-panel p-6 rounded-xl space-y-4">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">Select Marketplace</label>
            <select
              value={selectedMp}
              onChange={e => setSelectedMp(e.target.value as MarketplaceId)}
              className="w-full p-2.5 rounded-lg clean-input text-xs font-bold"
            >
              {Object.values(MARKETPLACE_CONFIGS).map(mp => (
                <option key={mp.id} value={mp.id}>
                  {mp.name} ({mp.structure === 'STRUCTURE_A' ? 'Structure A' : 'Structure B'})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">Select Month</label>
            <select
              value={targetMonthYear}
              onChange={e => setTargetMonthYear(e.target.value)}
              className="w-full p-2.5 rounded-lg clean-input text-xs font-bold"
            >
              {availableMonths.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={isExporting}
          className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
        >
          {isExporting ? 'Generating Excel File...' : `Download ${MARKETPLACE_CONFIGS[selectedMp].name} Sheet`}
        </button>

        {exportSuccessMsg && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
            ✓ {exportSuccessMsg}
          </div>
        )}

      </div>

    </div>
  );
};
