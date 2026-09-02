import React, { useState, useEffect } from 'react';
import { DailyCategoryStat, MarketplaceId } from '../../types';
import { MARKETPLACE_CONFIGS, MARKETPLACE_ORDER, FOOTWEAR_CATEGORIES, APPAREL_CATEGORIES, getCurrentISTMonthYear, getDefaultMonths } from '../../engine/constants';
import { generateMonthlyExcelWorkbook } from '../../engine/exporter';
import { useSalesStore } from '../../store/useSalesStore';
import {
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  X,
  Download,
  Plus,
  Calendar,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';

// ─── Frozen column pixel widths ─────────────────────────────────────────────
const COL_CATEGORY_W  = 160; // px – "Category" column
const COL_STYLE_W     = 100; // px – "Style Count" column (Myntra only)
const COL_DIVISION_W  = 110; // px – "Division" column

const LEFT_CATEGORY   = 0;
const LEFT_STYLE      = LEFT_CATEGORY + COL_CATEGORY_W;   // 160 (Myntra only)
const LEFT_DIVISION_MYNTRA = LEFT_STYLE + COL_STYLE_W;    // 260 (Myntra only)
const LEFT_DIVISION_OTHER  = LEFT_CATEGORY + COL_CATEGORY_W; // 160 (For Amazon & Rest Channels without Style Count)

const stickyStyle = (left: number, bg: string, zIndex = 20): React.CSSProperties => ({
  position: 'sticky',
  left,
  zIndex,
  background: bg,
  boxShadow: (left === LEFT_DIVISION_MYNTRA || left === LEFT_DIVISION_OTHER) ? '2px 0 4px -2px rgba(0,0,0,0.12)' : undefined,
});

// For Myntra (with Style Count)
const TH_CATEGORY  = (bg: string): React.CSSProperties => ({ ...stickyStyle(LEFT_CATEGORY, bg, 40), width: COL_CATEGORY_W, minWidth: COL_CATEGORY_W });
const TH_STYLE     = (bg: string): React.CSSProperties => ({ ...stickyStyle(LEFT_STYLE, bg, 40), width: COL_STYLE_W, minWidth: COL_STYLE_W });
const TH_DIVISION_MYNTRA = (bg: string): React.CSSProperties => ({ ...stickyStyle(LEFT_DIVISION_MYNTRA, bg, 40), width: COL_DIVISION_W, minWidth: COL_DIVISION_W, boxShadow: '3px 0 6px -3px rgba(0,0,0,0.15)' });

const TD_CATEGORY  = (bg: string): React.CSSProperties => ({ ...stickyStyle(LEFT_CATEGORY, bg, 20), width: COL_CATEGORY_W, minWidth: COL_CATEGORY_W });
const TD_STYLE     = (bg: string): React.CSSProperties => ({ ...stickyStyle(LEFT_STYLE, bg, 20), width: COL_STYLE_W, minWidth: COL_STYLE_W });
const TD_DIVISION_MYNTRA = (bg: string): React.CSSProperties => ({ ...stickyStyle(LEFT_DIVISION_MYNTRA, bg, 20), width: COL_DIVISION_W, minWidth: COL_DIVISION_W, boxShadow: '3px 0 6px -3px rgba(0,0,0,0.15)' });

// For Amazon & Rest Channels (WITHOUT Style Count)
const TH_DIVISION_OTHER = (bg: string): React.CSSProperties => ({ ...stickyStyle(LEFT_DIVISION_OTHER, bg, 40), width: COL_DIVISION_W, minWidth: COL_DIVISION_W, boxShadow: '3px 0 6px -3px rgba(0,0,0,0.15)' });
const TD_DIVISION_OTHER = (bg: string): React.CSSProperties => ({ ...stickyStyle(LEFT_DIVISION_OTHER, bg, 20), width: COL_DIVISION_W, minWidth: COL_DIVISION_W, boxShadow: '3px 0 6px -3px rgba(0,0,0,0.15)' });

// Month & Calendar Helper Utilities
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'June',
  'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'
];

interface ParsedMonthYear {
  monthIndex: number;
  monthName: string;
  shortMonth: string;
  year: number;
  daysInMonth: number;
}

function parseMonthYear(monthYearStr: string): ParsedMonthYear {
  const currentIST = getCurrentISTMonthYear();
  const fallbackParts = currentIST.split(' ');
  const defaultMonthName = fallbackParts[0] || 'September';
  const defaultYear = parseInt(fallbackParts[1], 10) || 2026;

  const parts = (monthYearStr || currentIST).trim().split(/\s+/);
  const mName = parts[0] || defaultMonthName;
  const year = parseInt(parts[1], 10) || defaultYear;

  let mIdx = MONTH_NAMES.findIndex(m => m.toLowerCase() === mName.toLowerCase());
  if (mIdx === -1) {
    mIdx = SHORT_MONTH_NAMES.findIndex(m => m.toLowerCase() === mName.toLowerCase());
  }
  if (mIdx === -1) {
    mIdx = MONTH_NAMES.findIndex(m => m.toLowerCase() === defaultMonthName.toLowerCase());
  }
  if (mIdx === -1) mIdx = 8; // Default September

  const daysInMonth = new Date(year, mIdx + 1, 0).getDate();

  return {
    monthIndex: mIdx,
    monthName: MONTH_NAMES[mIdx] || defaultMonthName,
    shortMonth: SHORT_MONTH_NAMES[mIdx] || 'Sept',
    year,
    daysInMonth
  };
}

function getRealWeekdayName(year: number, monthIndex: number, day: number): string {
  const d = new Date(year, monthIndex, day);
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

// ============================================================================
// SHARED SUMMARY CARDS (shown below every channel's sheets)
// ============================================================================
function SummaryCards({
  grandTotal,
  grandTotalNew,
  fwTotal,
  apTotal
}: {
  grandTotal: number;
  grandTotalNew: number;
  fwTotal: number;
  apTotal: number;
}) {
  const TOTAL_BG = '#fff2cc';
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Box 1: New Style Contribution */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h4 style={{ fontSize: 11, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 12 }}>
          Day Level New Style Contribution
        </h4>
        <table style={{ width: '100%', fontSize: 12, fontFamily: 'monospace' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '7px 0', color: '#64748b' }}>Total Unit Sold</td>
              <td style={{ padding: '7px 0', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{grandTotal}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '7px 0', color: '#64748b' }}>New Style Units Sold</td>
              <td style={{ padding: '7px 0', textAlign: 'right', fontWeight: 700, color: '#be123c' }}>{grandTotalNew}</td>
            </tr>
            <tr>
              <td style={{ padding: '7px 0', fontWeight: 800, color: '#0f172a' }}>New Contr. Share (%)</td>
              <td style={{ padding: '7px 0', textAlign: 'right', fontWeight: 800, color: '#0369a1', fontSize: 13 }}>
                {grandTotal > 0 ? ((grandTotalNew / grandTotal) * 100).toFixed(1) + '%' : '0.0%'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Box 2: Division Level Summary */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h4 style={{ fontSize: 11, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 12 }}>
          Division Level Summary
        </h4>
        <table style={{ width: '100%', fontSize: 12, fontFamily: 'monospace', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: 11, fontWeight: 700 }}>Division</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: 11, fontWeight: 700 }}>Units</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: 11, fontWeight: 700 }}>% Share</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '7px 8px', fontWeight: 700, color: '#0f172a' }}>Footwear</td>
              <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700 }}>{fwTotal}</td>
              <td style={{ padding: '7px 8px', textAlign: 'right', color: '#64748b' }}>{grandTotal > 0 ? ((fwTotal / grandTotal) * 100).toFixed(1) + '%' : '0.0%'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '7px 8px', fontWeight: 700, color: '#0f172a' }}>Apparel</td>
              <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700 }}>{apTotal}</td>
              <td style={{ padding: '7px 8px', textAlign: 'right', color: '#64748b' }}>{grandTotal > 0 ? ((apTotal / grandTotal) * 100).toFixed(1) + '%' : '0.0%'}</td>
            </tr>
            <tr style={{ background: TOTAL_BG, fontWeight: 800 }}>
              <td style={{ padding: '7px 8px', color: '#0f172a' }}>Total</td>
              <td style={{ padding: '7px 8px', textAlign: 'right', color: '#0f172a' }}>{grandTotal}</td>
              <td style={{ padding: '7px 8px', textAlign: 'right', color: '#0f172a' }}>100%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface ExcelSheetViewProps {
  stats: DailyCategoryStat[];
  myntraStyleCounts: Record<string, number>;
  selectedMonthYear: string;
  onMonthChange: (monthYear: string) => void;
}

export const ExcelSheetView: React.FC<ExcelSheetViewProps> = ({
  stats,
  myntraStyleCounts,
  selectedMonthYear,
  onMonthChange
}) => {
  const { customMonths, addCustomMonth } = useSalesStore();

  const [activeMarketplace, setActiveMarketplace] = useState<MarketplaceId>('myntra');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isExpandedGlobal, setIsExpandedGlobal] = useState(false);
  
  // Floating vertical drawer state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Add New Month Modal State
  const [isAddMonthOpen, setIsAddMonthOpen] = useState(false);
  const currentISTParts = getCurrentISTMonthYear().split(' ');
  const [newMonthSelect, setNewMonthSelect] = useState(currentISTParts[0] || 'September');
  const [newYearSelect, setNewYearSelect] = useState(currentISTParts[1] || '2026');

  const currentConfig = MARKETPLACE_CONFIGS[activeMarketplace];

  // Combined list of months
  const availableMonthsSet = new Set<string>(customMonths);
  getDefaultMonths().forEach(m => availableMonthsSet.add(m));
  availableMonthsSet.add(getCurrentISTMonthYear());
  stats.forEach(s => availableMonthsSet.add(s.monthYearKey));
  const availableMonths = Array.from(availableMonthsSet);

  const parsedMY = parseMonthYear(selectedMonthYear);

  const filteredStats = stats.filter(
    s => s.monthYearKey === selectedMonthYear && s.marketplaceId === activeMarketplace
  );

  // Generate days 1..daysInMonth
  const days = Array.from({ length: parsedMY.daysInMonth }, (_, i) => i + 1);

  // Keyboard shortcut ESC to close sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDownloadExcel = async () => {
    setIsDownloading(true);
    try {
      const buffer = await generateMonthlyExcelWorkbook(
        activeMarketplace, selectedMonthYear, filteredStats, myntraStyleCounts
      );
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanMp = currentConfig.name.replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `${cleanMp}_${selectedMonthYear.replace(/\s+/g, '_')}_Monthly_Sheet.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCreateNewMonth = () => {
    const monthYearStr = `${newMonthSelect} ${newYearSelect}`;
    addCustomMonth(monthYearStr);
    onMonthChange(monthYearStr);
    setIsAddMonthOpen(false);
  };

  return (
    <div className="space-y-5 pb-12 pt-0.5 relative">

      {/* ── FLOATING COMPACT ICON-ONLY TOGGLE BUTTON ── */}
      <div className="fixed top-24 left-0 z-40">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title="Sheet Controls & Filters"
          aria-label="Toggle Sheet Controls"
          className={`w-10 h-10 rounded-r-xl rounded-l-none shadow-2xl border-y border-r backdrop-blur-md transition-all duration-200 active:scale-95 flex items-center justify-center group ${
            isSidebarOpen
              ? 'bg-sky-600 text-white border-sky-400 shadow-sky-500/30'
              : 'bg-slate-900/95 hover:bg-slate-900 text-white border-slate-700/80 shadow-slate-900/40 hover:border-sky-500/50 hover:scale-105'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <SlidersHorizontal className="w-5 h-5 text-sky-400 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-pulse" />
          </div>
        </button>
      </div>

      {/* ── BACKDROP OVERLAY WHEN SIDEBAR IS OPEN ── */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300"
        />
      )}

      {/* ── VERTICAL SLIDEOUT CONTROLS PANEL ── */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-84 sm:w-96 bg-white z-50 shadow-2xl border-r border-slate-200 flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Section */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-tight">Sheet Controls</h2>
              <p className="text-[11px] text-slate-400">Marketplaces &amp; Date Period</p>
            </div>
          </div>

          <button
            onClick={() => setIsSidebarOpen(false)}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Middle Scrollable Section */}
        <div className="flex-1 p-5 overflow-y-auto space-y-6">
          
          {/* Section 1: Marketplaces List in Exact User Order */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                Select Marketplace
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">
                7 Channels
              </span>
            </div>

            <div className="space-y-1.5">
              {MARKETPLACE_ORDER.map(mpId => {
                const mp = MARKETPLACE_CONFIGS[mpId];
                const isActive = mp.id === activeMarketplace;
                return (
                  <button
                    key={mp.id}
                    onClick={() => {
                      setActiveMarketplace(mp.id);
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between border ${
                      isActive
                        ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/20 translate-x-1'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-slate-300'}`} />
                      <span>{mp.name}</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {mp.structure === 'STRUCTURE_A' ? 'Structure A' : 'Structure B'}
                      </span>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Sub-Channels Toggle (Structure A) */}
          {currentConfig.structure === 'STRUCTURE_A' && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider block">
                Sub-Channel Columns
              </span>
              <button
                onClick={() => setIsExpandedGlobal(!isExpandedGlobal)}
                className="w-full py-2 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs flex items-center justify-center space-x-2 shadow-xs transition-colors"
              >
                <span className="w-5 h-5 rounded bg-slate-200 font-mono text-[12px] font-black flex items-center justify-center">
                  {isExpandedGlobal ? '−' : '+'}
                </span>
                <span>{isExpandedGlobal ? 'Collapse to Daily Totals' : 'Expand All Sub-Channels'}</span>
              </button>
            </div>
          )}

          {/* Section 3: Month Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                Date Range (Month)
              </span>
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <div className="space-y-2">
              <select
                value={selectedMonthYear}
                onChange={e => onMonthChange(e.target.value)}
                className="w-full p-2.5 rounded-xl clean-input text-xs font-bold border border-slate-200 bg-white shadow-xs"
              >
                {availableMonths.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              <button
                onClick={() => setIsAddMonthOpen(true)}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center space-x-1.5 border border-slate-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-slate-600" />
                <span>Add Custom Month Sheet</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Actions Section */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 space-y-2">
          <button
            onClick={handleDownloadExcel}
            disabled={isDownloading}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? 'Generating Workbook...' : 'Download Excel Sheet'}</span>
          </button>
          <p className="text-[10px] text-center text-slate-400">
            Press <kbd className="px-1 py-0.5 rounded bg-slate-200 font-mono text-[9px] text-slate-600">ESC</kbd> to dismiss this panel
          </p>
        </div>
      </aside>

      {/* ── ADD NEW MONTH MODAL ── */}
      {isAddMonthOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Add New Month Sheet</h3>
              <button
                onClick={() => setIsAddMonthOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Month</label>
                <select
                  value={newMonthSelect}
                  onChange={e => setNewMonthSelect(e.target.value)}
                  className="w-full p-2.5 rounded-lg clean-input text-xs font-bold"
                >
                  {MONTH_NAMES.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Year</label>
                <select
                  value={newYearSelect}
                  onChange={e => setNewYearSelect(e.target.value)}
                  className="w-full p-2.5 rounded-lg clean-input text-xs font-bold"
                >
                  {['2025', '2026', '2027', '2028', '2029', '2030'].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsAddMonthOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewMonth}
                className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs"
              >
                Add Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SHEETS RENDERED AT THE TOP ── */}
      {activeMarketplace === 'myntra' && (
        <MyntraSheets
          days={days}
          parsedMY={parsedMY}
          stats={filteredStats}
          myntraStyleCounts={myntraStyleCounts}
          isExpandedGlobal={isExpandedGlobal}
        />
      )}
      {activeMarketplace === 'amazon' && (
        <AmazonSheets
          days={days}
          parsedMY={parsedMY}
          stats={filteredStats}
          isExpandedGlobal={isExpandedGlobal}
        />
      )}
      {activeMarketplace !== 'myntra' && activeMarketplace !== 'amazon' && (
        <RestChannelSheets
          days={days}
          parsedMY={parsedMY}
          stats={filteredStats}
          marketplaceName={currentConfig.name}
        />
      )}
    </div>
  );
};

// ============================================================================
// MYNTRA SHEETS (WITH STYLE COUNT COLUMN)
// ============================================================================
function MyntraSheets({
  days, parsedMY, stats, myntraStyleCounts, isExpandedGlobal
}: {
  days: number[];
  parsedMY: ParsedMonthYear;
  stats: DailyCategoryStat[];
  myntraStyleCounts: Record<string, number>;
  isExpandedGlobal: boolean;
}) {
  const [dayExpandMap, setDayExpandMap] = useState<Record<number, boolean>>({});
  const toggleDay = (d: number) => setDayExpandMap(p => ({ ...p, [d]: !p[d] }));
  const isDayExpanded = (d: number) => dayExpandMap[d] !== undefined ? dayExpandMap[d] : isExpandedGlobal;

  // Fullscreen expansion state for each sheet
  const [isFullScreenSales, setIsFullScreenSales] = useState(false);
  const [isFullScreenNew, setIsFullScreenNew] = useState(false);

  const categories = [...FOOTWEAR_CATEGORIES, ...APPAREL_CATEGORIES];

  type DayRec = { ppmp: number; sjit: number; ppmpNew: number; sjitNew: number };
  const lookup = new Map<string, Map<number, DayRec>>();
  stats.forEach(s => {
    if (!lookup.has(s.category)) lookup.set(s.category, new Map());
    const dm = lookup.get(s.category)!;
    if (!dm.has(s.day)) dm.set(s.day, { ppmp: 0, sjit: 0, ppmpNew: 0, sjitNew: 0 });
    const r = dm.get(s.day)!;
    if (s.subChannel === 'PPMP' || s.channelName.includes('MYNTRA_ONLINE')) {
      r.ppmp += s.totalUnits; r.ppmpNew += s.newStyleUnits;
    } else {
      r.sjit += s.totalUnits; r.sjitNew += s.newStyleUnits;
    }
  });

  type DayTotal = { ppmp: number; sjit: number; total: number; ppmpNew: number; sjitNew: number; totalNew: number };
  const dayTotals: Record<number, DayTotal> = {};
  days.forEach(d => { dayTotals[d] = { ppmp: 0, sjit: 0, total: 0, ppmpNew: 0, sjitNew: 0, totalNew: 0 }; });
  let fwTotal = 0, apTotal = 0;
  categories.forEach(c => {
    const dm = lookup.get(c.name);
    days.forEach(d => {
      const r = dm?.get(d);
      if (r) {
        dayTotals[d].ppmp += r.ppmp; dayTotals[d].sjit += r.sjit;
        dayTotals[d].total += r.ppmp + r.sjit;
        dayTotals[d].ppmpNew += r.ppmpNew; dayTotals[d].sjitNew += r.sjitNew;
        dayTotals[d].totalNew += r.ppmpNew + r.sjitNew;
        if (c.division === 'FOOTWEAR') fwTotal += r.ppmp + r.sjit;
        else apTotal += r.ppmp + r.sjit;
      }
    });
  });
  const grandTotal    = Object.values(dayTotals).reduce((a, b) => a + b.total, 0);
  const grandTotalNew = Object.values(dayTotals).reduce((a, b) => a + b.totalNew, 0);

  const HEADER_BG     = '#e2efda';
  const HEADER2_BG    = '#c6e0b4';
  const TOTAL_BG      = '#fff2cc';
  const WHITE         = '#ffffff';
  const GREY          = '#f2f2f2';

  return (
    <div className="space-y-8">

      {/* ──── CARD 1: MONTHLY SALES SHEET ──── */}
      <div className={`rounded-2xl border border-slate-200 shadow-sm overflow-hidden bg-white transition-all ${
        isFullScreenSales ? 'fixed inset-0 z-50 rounded-none p-4 sm:p-6 flex flex-col' : ''
      }`}>
        <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-black text-xs text-emerald-900 uppercase tracking-wide">
              Myntra + SJIT — Monthly Sales Sheet ({parsedMY.monthName} {parsedMY.year})
            </span>
            <span className="text-[11px] text-emerald-700 hidden sm:inline">· Frozen Headers</span>
          </div>

          <button
            onClick={() => setIsFullScreenSales(!isFullScreenSales)}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition-all active:scale-95"
          >
            {isFullScreenSales ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Fullscreen</span>
              </>
            )}
          </button>
        </div>

        <div className={`overflow-auto ${isFullScreenSales ? 'flex-1 max-h-none' : 'max-h-[65vh]'}`} style={{ position: 'relative' }}>
          <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: '100%' }}>
            <colgroup>
              <col style={{ width: COL_CATEGORY_W }} />
              <col style={{ width: COL_STYLE_W }} />
              <col style={{ width: COL_DIVISION_W }} />
            </colgroup>

            <thead style={{ position: 'sticky', top: 0, zIndex: 30 }}>
              {/* ROW 1: Real Weekday names */}
              <tr>
                <th style={{ ...TH_CATEGORY(HEADER_BG), padding: '6px 8px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #94a3b8', fontSize: 11 }}>Category Level</th>
                <th style={{ ...TH_STYLE(HEADER_BG),    padding: '6px 8px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #94a3b8', fontSize: 11, textAlign: 'center' }}>Style Count</th>
                <th style={{ ...TH_DIVISION_MYNTRA(HEADER_BG), padding: '6px 8px', borderBottom: '1px solid #94a3b8', fontSize: 11 }}>Division</th>

                {days.map(d => {
                  const expanded = isDayExpanded(d);
                  const weekdayName = getRealWeekdayName(parsedMY.year, parsedMY.monthIndex, d);
                  return (
                    <th key={d} colSpan={expanded ? 3 : 1}
                      style={{ background: HEADER2_BG, padding: '6px 4px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #94a3b8', fontSize: 10, textAlign: 'center', fontWeight: 700, minWidth: expanded ? 180 : 65 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <button
                          onClick={() => toggleDay(d)}
                          style={{ padding: '0 4px', borderRadius: 3, background: 'rgba(255,255,255,0.8)', border: '1px solid #94a3b8', fontWeight: 900, fontSize: 11, cursor: 'pointer', lineHeight: 1.4 }}
                        >{expanded ? '−' : '+'}</button>
                        <span>{weekdayName}</span>
                      </div>
                    </th>
                  );
                })}

                <th style={{ background: TOTAL_BG, padding: '6px 8px', borderLeft: '2px solid #94a3b8', borderBottom: '1px solid #94a3b8', fontSize: 11, textAlign: 'center', fontWeight: 700, minWidth: 80 }}>Grand Total</th>
                <th style={{ background: TOTAL_BG, padding: '6px 8px', borderBottom: '1px solid #94a3b8', fontSize: 11, textAlign: 'center', fontWeight: 700, minWidth: 60 }}>Share %</th>
              </tr>

              {/* ROW 2: Formatted Date Label (e.g. 1 Aug, 13 July) */}
              <tr>
                <th style={{ ...TH_CATEGORY(GREY), padding: '5px 8px', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #94a3b8', fontSize: 11, fontWeight: 700 }}>Category</th>
                <th style={{ ...TH_STYLE(GREY),    padding: '5px 8px', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #94a3b8', fontSize: 11, fontWeight: 700, textAlign: 'center' }}>Online Style</th>
                <th style={{ ...TH_DIVISION_MYNTRA(GREY), padding: '5px 8px', borderBottom: '2px solid #94a3b8', fontSize: 11, fontWeight: 700 }}>Division</th>

                {days.map(d => {
                  const expanded = isDayExpanded(d);
                  const dateLabel = `${d} ${parsedMY.shortMonth}`;
                  if (expanded) {
                    return (
                      <React.Fragment key={d}>
                        <th style={{ background: WHITE, padding: '5px 4px', borderRight: '1px solid #e2e8f0', borderBottom: '2px solid #94a3b8', fontSize: 10, textAlign: 'center', fontWeight: 700, minWidth: 60 }}>{d} PPMP</th>
                        <th style={{ background: WHITE, padding: '5px 4px', borderRight: '1px solid #e2e8f0', borderBottom: '2px solid #94a3b8', fontSize: 10, textAlign: 'center', fontWeight: 700, minWidth: 60 }}>{d} SJIT</th>
                        <th style={{ background: HEADER_BG, padding: '5px 4px', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #94a3b8', fontSize: 10, textAlign: 'center', fontWeight: 800, minWidth: 60 }}>{d} Total</th>
                      </React.Fragment>
                    );
                  }
                  return <th key={d} style={{ background: HEADER_BG, padding: '5px 4px', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #94a3b8', fontSize: 10, textAlign: 'center', fontWeight: 800, minWidth: 65 }}>{dateLabel}</th>;
                })}

                <th style={{ background: TOTAL_BG, padding: '5px 8px', borderLeft: '2px solid #94a3b8', borderBottom: '2px solid #94a3b8', fontSize: 11, textAlign: 'center', fontWeight: 700 }}>Total Units</th>
                <th style={{ background: TOTAL_BG, padding: '5px 8px', borderBottom: '2px solid #94a3b8', fontSize: 11, textAlign: 'center', fontWeight: 700 }}>% Share</th>
              </tr>
            </thead>

            <tbody>
              {categories.map(cat => {
                const sc = myntraStyleCounts[cat.name] ?? (cat as any).defaultMyntraStyleCount ?? 0;
                const dm = lookup.get(cat.name);
                let rowTotal = 0;
                days.forEach(d => { const r = dm?.get(d); if (r) rowTotal += r.ppmp + r.sjit; });
                const share = grandTotal > 0 ? ((rowTotal / grandTotal) * 100).toFixed(1) + '%' : '0.0%';

                return (
                  <tr key={cat.name} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ ...TD_CATEGORY(WHITE), padding: '5px 8px', borderRight: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{cat.name}</td>
                    <td style={{ ...TD_STYLE(WHITE),    padding: '5px 8px', borderRight: '1px solid #e2e8f0', fontSize: 11, textAlign: 'center', color: '#475569' }}>{sc}</td>
                    <td style={{ ...TD_DIVISION_MYNTRA(WHITE), padding: '5px 8px', fontSize: 11, color: '#64748b' }}>{cat.division}</td>

                    {days.map(d => {
                      const expanded = isDayExpanded(d);
                      const r = dm?.get(d);
                      const ppmp = r?.ppmp || 0, sjit = r?.sjit || 0, tot = ppmp + sjit;
                      if (expanded) {
                        return (
                          <React.Fragment key={d}>
                            <td style={{ padding: '5px 4px', textAlign: 'center', fontSize: 11, color: ppmp ? '#0f172a' : '#94a3b8', borderRight: '1px solid #f1f5f9' }}>{ppmp || '–'}</td>
                            <td style={{ padding: '5px 4px', textAlign: 'center', fontSize: 11, color: sjit ? '#0f172a' : '#94a3b8', borderRight: '1px solid #f1f5f9' }}>{sjit || '–'}</td>
                            <td style={{ padding: '5px 4px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: tot ? '#065f46' : '#94a3b8', background: tot ? '#f0fdf4' : WHITE, borderRight: '1px solid #e2e8f0' }}>{tot || '–'}</td>
                          </React.Fragment>
                        );
                      }
                      return <td key={d} style={{ padding: '5px 4px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: tot ? '#065f46' : '#94a3b8', background: tot ? '#f0fdf4' : WHITE, borderRight: '1px solid #e2e8f0' }}>{tot || '–'}</td>;
                    })}

                    <td style={{ background: TOTAL_BG, padding: '5px 8px', textAlign: 'center', fontSize: 11, fontWeight: 700, borderLeft: '2px solid #94a3b8', color: '#0f172a' }}>{rowTotal}</td>
                    <td style={{ background: TOTAL_BG, padding: '5px 8px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{share}</td>
                  </tr>
                );
              })}

              <tr style={{ borderTop: '2px solid #94a3b8', background: TOTAL_BG }}>
                <td style={{ ...TD_CATEGORY(TOTAL_BG), padding: '6px 8px', borderRight: '1px solid #94a3b8', fontSize: 11, fontWeight: 800, color: '#0f172a' }}>Grand Total</td>
                <td style={{ ...TD_STYLE(TOTAL_BG),    padding: '6px 8px', borderRight: '1px solid #94a3b8', fontSize: 11, textAlign: 'center', color: '#475569' }}>–</td>
                <td style={{ ...TD_DIVISION_MYNTRA(TOTAL_BG), padding: '6px 8px', fontSize: 11, color: '#475569' }}>–</td>

                {days.map(d => {
                  const expanded = isDayExpanded(d);
                  if (expanded) {
                    return (
                      <React.Fragment key={d}>
                        <td style={{ padding: '6px 4px', textAlign: 'center', fontSize: 11, fontWeight: 800, borderRight: '1px solid #e2e8f0' }}>{dayTotals[d].ppmp}</td>
                        <td style={{ padding: '6px 4px', textAlign: 'center', fontSize: 11, fontWeight: 800, borderRight: '1px solid #e2e8f0' }}>{dayTotals[d].sjit}</td>
                        <td style={{ padding: '6px 4px', textAlign: 'center', fontSize: 12, fontWeight: 900, color: '#065f46', borderRight: '1px solid #94a3b8' }}>{dayTotals[d].total}</td>
                      </React.Fragment>
                    );
                  }
                  return <td key={d} style={{ padding: '6px 4px', textAlign: 'center', fontSize: 12, fontWeight: 900, color: '#065f46', borderRight: '1px solid #e2e8f0' }}>{dayTotals[d].total}</td>;
                })}

                <td style={{ background: TOTAL_BG, padding: '6px 8px', textAlign: 'center', fontSize: 12, fontWeight: 900, borderLeft: '2px solid #94a3b8', color: '#0f172a' }}>{grandTotal}</td>
                <td style={{ background: TOTAL_BG, padding: '6px 8px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#0f172a' }}>100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ──── CARD 2: NEW CONTRIBUTION SHEET ──── */}
      <div className={`rounded-2xl border border-rose-200 shadow-sm overflow-hidden bg-white transition-all ${
        isFullScreenNew ? 'fixed inset-0 z-50 rounded-none p-4 sm:p-6 flex flex-col' : ''
      }`}>
        <div className="px-4 py-3 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-black text-xs text-rose-900 uppercase tracking-wide">
              Myntra + SJIT — New Contribution Sheet ({parsedMY.monthName} {parsedMY.year})
            </span>
            <span className="text-[11px] text-rose-700 hidden sm:inline">· "New" Column Entries</span>
          </div>

          <button
            onClick={() => setIsFullScreenNew(!isFullScreenNew)}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-xs transition-all active:scale-95"
          >
            {isFullScreenNew ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Fullscreen</span>
              </>
            )}
          </button>
        </div>

        <div className={`overflow-auto ${isFullScreenNew ? 'flex-1 max-h-none' : 'max-h-[65vh]'}`} style={{ position: 'relative' }}>
          <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: '100%' }}>
            <colgroup>
              <col style={{ width: COL_CATEGORY_W }} />
              <col style={{ width: COL_STYLE_W }} />
              <col style={{ width: COL_DIVISION_W }} />
            </colgroup>

            <thead style={{ position: 'sticky', top: 0, zIndex: 30 }}>
              <tr>
                <th style={{ ...TH_CATEGORY('#fce4d6'), padding: '6px 8px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #94a3b8', fontSize: 11 }}>Category Level</th>
                <th style={{ ...TH_STYLE('#fce4d6'),    padding: '6px 8px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #94a3b8', fontSize: 11, textAlign: 'center' }}>Style Count</th>
                <th style={{ ...TH_DIVISION_MYNTRA('#fce4d6'), padding: '6px 8px', borderBottom: '1px solid #94a3b8', fontSize: 11 }}>Division</th>
                {days.map(d => {
                  const expanded = isDayExpanded(d);
                  const weekdayName = getRealWeekdayName(parsedMY.year, parsedMY.monthIndex, d);
                  return (
                    <th key={d} colSpan={expanded ? 3 : 1}
                      style={{ background: '#f8cbad', padding: '6px 4px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #94a3b8', fontSize: 10, textAlign: 'center', fontWeight: 700, minWidth: expanded ? 180 : 65 }}>
                      {weekdayName}
                    </th>
                  );
                })}
                <th style={{ background: TOTAL_BG, padding: '6px 8px', borderLeft: '2px solid #94a3b8', borderBottom: '1px solid #94a3b8', fontSize: 11, textAlign: 'center', fontWeight: 700, minWidth: 80 }}>Grand Total</th>
              </tr>
              <tr>
                <th style={{ ...TH_CATEGORY(GREY), padding: '5px 8px', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #94a3b8', fontSize: 11, fontWeight: 700 }}>Category</th>
                <th style={{ ...TH_STYLE(GREY),    padding: '5px 8px', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #94a3b8', fontSize: 11, fontWeight: 700, textAlign: 'center' }}>Online Style</th>
                <th style={{ ...TH_DIVISION_MYNTRA(GREY), padding: '5px 8px', borderBottom: '2px solid #94a3b8', fontSize: 11, fontWeight: 700 }}>Division</th>
                {days.map(d => {
                  const expanded = isDayExpanded(d);
                  const dateLabel = `${d} ${parsedMY.shortMonth}`;
                  if (expanded) {
                    return (
                      <React.Fragment key={d}>
                        <th style={{ background: WHITE, padding: '5px 4px', borderRight: '1px solid #e2e8f0', borderBottom: '2px solid #94a3b8', fontSize: 10, textAlign: 'center', fontWeight: 700, minWidth: 60 }}>{d} PPMP</th>
                        <th style={{ background: WHITE, padding: '5px 4px', borderRight: '1px solid #e2e8f0', borderBottom: '2px solid #94a3b8', fontSize: 10, textAlign: 'center', fontWeight: 700, minWidth: 60 }}>{d} SJIT</th>
                        <th style={{ background: '#fce4d6', padding: '5px 4px', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #94a3b8', fontSize: 10, textAlign: 'center', fontWeight: 800, minWidth: 60 }}>{d} Total</th>
                      </React.Fragment>
                    );
                  }
                  return <th key={d} style={{ background: '#fce4d6', padding: '5px 4px', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #94a3b8', fontSize: 10, textAlign: 'center', fontWeight: 800, minWidth: 65 }}>{dateLabel}</th>;
                })}
                <th style={{ background: TOTAL_BG, padding: '5px 8px', borderLeft: '2px solid #94a3b8', borderBottom: '2px solid #94a3b8', fontSize: 11, textAlign: 'center', fontWeight: 700 }}>Total Units</th>
              </tr>
            </thead>

            <tbody>
              {categories.map(cat => {
                const sc = myntraStyleCounts[cat.name] ?? (cat as any).defaultMyntraStyleCount ?? 0;
                const dm = lookup.get(cat.name);
                let newRowTotal = 0;
                days.forEach(d => { const r = dm?.get(d); if (r) newRowTotal += r.ppmpNew + r.sjitNew; });

                return (
                  <tr key={cat.name} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ ...TD_CATEGORY(WHITE), padding: '5px 8px', borderRight: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{cat.name}</td>
                    <td style={{ ...TD_STYLE(WHITE),    padding: '5px 8px', borderRight: '1px solid #e2e8f0', fontSize: 11, textAlign: 'center', color: '#475569' }}>{sc}</td>
                    <td style={{ ...TD_DIVISION_MYNTRA(WHITE), padding: '5px 8px', fontSize: 11, color: '#64748b' }}>{cat.division}</td>
                    {days.map(d => {
                      const expanded = isDayExpanded(d);
                      const r = dm?.get(d);
                      const pn = r?.ppmpNew || 0, sn = r?.sjitNew || 0, tn = pn + sn;
                      if (expanded) {
                        return (
                          <React.Fragment key={d}>
                            <td style={{ padding: '5px 4px', textAlign: 'center', fontSize: 11, color: pn ? '#0f172a' : '#94a3b8', borderRight: '1px solid #f1f5f9' }}>{pn || '–'}</td>
                            <td style={{ padding: '5px 4px', textAlign: 'center', fontSize: 11, color: sn ? '#0f172a' : '#94a3b8', borderRight: '1px solid #f1f5f9' }}>{sn || '–'}</td>
                            <td style={{ padding: '5px 4px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: tn ? '#9f1239' : '#94a3b8', background: tn ? '#fff1f2' : WHITE, borderRight: '1px solid #e2e8f0' }}>{tn || '–'}</td>
                          </React.Fragment>
                        );
                      }
                      return <td key={d} style={{ padding: '5px 4px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: tn ? '#9f1239' : '#94a3b8', background: tn ? '#fff1f2' : WHITE, borderRight: '1px solid #e2e8f0' }}>{tn || '–'}</td>;
                    })}
                    <td style={{ background: '#fff1f2', padding: '5px 8px', textAlign: 'center', fontSize: 11, fontWeight: 700, borderLeft: '2px solid #94a3b8', color: '#9f1239' }}>{newRowTotal}</td>
                  </tr>
                );
              })}
              <tr style={{ borderTop: '2px solid #94a3b8', background: '#fce4d6' }}>
                <td style={{ ...TD_CATEGORY('#fce4d6'), padding: '6px 8px', borderRight: '1px solid #94a3b8', fontSize: 11, fontWeight: 800, color: '#7f1d1d' }}>Grand Total New</td>
                <td style={{ ...TD_STYLE('#fce4d6'),    padding: '6px 8px', borderRight: '1px solid #94a3b8', fontSize: 11, textAlign: 'center' }}>–</td>
                <td style={{ ...TD_DIVISION_MYNTRA('#fce4d6'), padding: '6px 8px', fontSize: 11 }}>–</td>
                {days.map(d => {
                  const expanded = isDayExpanded(d);
                  if (expanded) {
                    return (
                      <React.Fragment key={d}>
                        <td style={{ padding: '6px 4px', textAlign: 'center', fontSize: 11, fontWeight: 800, borderRight: '1px solid #e2e8f0' }}>{dayTotals[d].ppmpNew}</td>
                        <td style={{ padding: '6px 4px', textAlign: 'center', fontSize: 11, fontWeight: 800, borderRight: '1px solid #e2e8f0' }}>{dayTotals[d].sjitNew}</td>
                        <td style={{ padding: '6px 4px', textAlign: 'center', fontSize: 12, fontWeight: 900, color: '#9f1239', borderRight: '1px solid #94a3b8' }}>{dayTotals[d].totalNew}</td>
                      </React.Fragment>
                    );
                  }
                  return <td key={d} style={{ padding: '6px 4px', textAlign: 'center', fontSize: 12, fontWeight: 900, color: '#9f1239', borderRight: '1px solid #e2e8f0' }}>{dayTotals[d].totalNew}</td>;
                })}
                <td style={{ background: TOTAL_BG, padding: '6px 8px', textAlign: 'center', fontSize: 12, fontWeight: 900, borderLeft: '2px solid #94a3b8', color: '#7f1d1d' }}>{grandTotalNew}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ──── SUMMARY CARDS ──── */}
      <SummaryCards
        grandTotal={grandTotal}
        grandTotalNew={grandTotalNew}
        fwTotal={fwTotal}
        apTotal={apTotal}
      />
    </div>
  );
}

// ============================================================================
// AMAZON SHEETS (WITHOUT STYLE COUNT COLUMN)
// ============================================================================
function AmazonSheets({
  days, parsedMY, stats, isExpandedGlobal
}: {
  days: number[];
  parsedMY: ParsedMonthYear;
  stats: DailyCategoryStat[];
  isExpandedGlobal: boolean;
}) {
  const [dayExpandMap, setDayExpandMap] = useState<Record<number, boolean>>({});
  const toggleDay = (d: number) => setDayExpandMap(p => ({ ...p, [d]: !p[d] }));
  const isDayExpanded = (d: number) => dayExpandMap[d] !== undefined ? dayExpandMap[d] : isExpandedGlobal;

  // Fullscreen expansion state
  const [isFullScreenSales, setIsFullScreenSales] = useState(false);
  const [isFullScreenNew, setIsFullScreenNew] = useState(false);

  const categories = [...FOOTWEAR_CATEGORIES, ...APPAREL_CATEGORIES];

  type DayRec = { amz: number; coco: number; fba: number; amzN: number; cocoN: number; fbaN: number };
  const lookup = new Map<string, Map<number, DayRec>>();
  stats.forEach(s => {
    if (!lookup.has(s.category)) lookup.set(s.category, new Map());
    const dm = lookup.get(s.category)!;
    if (!dm.has(s.day)) dm.set(s.day, { amz: 0, coco: 0, fba: 0, amzN: 0, cocoN: 0, fbaN: 0 });
    const r = dm.get(s.day)!;
    if (s.channelName.includes('FBA') || s.subChannel === 'FBA') {
      r.fba += s.totalUnits; r.fbaN += s.newStyleUnits;
    } else if (s.channelName.includes('COCOBLU') || s.subChannel === 'Cocoblu') {
      r.coco += s.totalUnits; r.cocoN += s.newStyleUnits;
    } else {
      r.amz += s.totalUnits; r.amzN += s.newStyleUnits;
    }
  });

  type DayTotal = { amz: number; coco: number; fba: number; total: number; amzN: number; cocoN: number; fbaN: number; totalN: number };
  const dayTotals: Record<number, DayTotal> = {};
  days.forEach(d => { dayTotals[d] = { amz: 0, coco: 0, fba: 0, total: 0, amzN: 0, cocoN: 0, fbaN: 0, totalN: 0 }; });
  categories.forEach(c => {
    const dm = lookup.get(c.name);
    days.forEach(d => {
      const r = dm?.get(d);
      if (r) {
        dayTotals[d].amz += r.amz; dayTotals[d].coco += r.coco; dayTotals[d].fba += r.fba;
        dayTotals[d].total += r.amz + r.coco + r.fba;
        dayTotals[d].amzN += r.amzN; dayTotals[d].cocoN += r.cocoN; dayTotals[d].fbaN += r.fbaN;
        dayTotals[d].totalN += r.amzN + r.cocoN + r.fbaN;
      }
    });
  });
  const grandTotal    = Object.values(dayTotals).reduce((a, b) => a + b.total, 0);
  const grandTotalNew = Object.values(dayTotals).reduce((a, b) => a + b.totalN, 0);

  const HEADER_BG = '#ffe699';
  const HEADER2_BG = '#ffd966';
  const TOTAL_BG = '#fff2cc';
  const WHITE = '#ffffff';
  const GREY = '#f2f2f2';

  function renderSalesTable(isNew: boolean) {
    const isFullScreen = isNew ? isFullScreenNew : isFullScreenSales;
    const setIsFullScreen = isNew ? setIsFullScreenNew : setIsFullScreenSales;
    const title = isNew ? `Amazon + Cocoblu + FBA — New Contribution Sheet (${parsedMY.monthName} ${parsedMY.year})` : `Amazon + Cocoblu + FBA — Monthly Sales Sheet (${parsedMY.monthName} ${parsedMY.year})`;
    const hBg = isNew ? '#fce4d6' : HEADER_BG;
    const h2Bg = isNew ? '#f8cbad' : HEADER2_BG;
    const borderColor = isNew ? '#fda4af' : '#94a3b8';

    return (
      <div className={`rounded-2xl border shadow-sm overflow-hidden bg-white transition-all ${isNew ? 'border-amber-200' : 'border-slate-200'} ${
        isFullScreen ? 'fixed inset-0 z-50 rounded-none p-4 sm:p-6 flex flex-col' : ''
      }`}>
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-black text-xs text-amber-900 uppercase tracking-wide">{title}</span>
            <span className="text-[11px] text-amber-700 hidden sm:inline">· Category · Division → Frozen</span>
          </div>

          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-xs transition-all active:scale-95"
          >
            {isFullScreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Fullscreen</span>
              </>
            )}
          </button>
        </div>

        <div className={`overflow-auto ${isFullScreen ? 'flex-1 max-h-none' : 'max-h-[65vh]'}`} style={{ position: 'relative' }}>
          <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: '100%' }}>
            <colgroup>
              <col style={{ width: COL_CATEGORY_W }} />
              <col style={{ width: COL_DIVISION_W }} />
            </colgroup>

            <thead style={{ position: 'sticky', top: 0, zIndex: 30 }}>
              <tr>
                <th style={{ ...TH_CATEGORY(hBg), padding: '6px 8px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid '+borderColor, fontSize: 11 }}>Category Level</th>
                <th style={{ ...TH_DIVISION_OTHER(hBg), padding: '6px 8px', borderBottom: '1px solid '+borderColor, fontSize: 11 }}>Division</th>
                {days.map(d => {
                  const expanded = isDayExpanded(d);
                  const weekdayName = getRealWeekdayName(parsedMY.year, parsedMY.monthIndex, d);
                  return (
                    <th key={d} colSpan={expanded ? 3 : 1}
                      style={{ background: h2Bg, padding: '6px 4px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid '+borderColor, fontSize: 10, textAlign: 'center', fontWeight: 700, minWidth: expanded ? 180 : 65 }}>
                      {!isNew ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <button
                            onClick={() => toggleDay(d)}
                            style={{ padding: '0 4px', borderRadius: 3, background: 'rgba(255,255,255,0.8)', border: '1px solid #94a3b8', fontWeight: 900, fontSize: 11, cursor: 'pointer', lineHeight: 1.4 }}
                          >{expanded ? '−' : '+'}</button>
                          <span>{weekdayName}</span>
                        </div>
                      ) : weekdayName}
                    </th>
                  );
                })}
                <th style={{ background: TOTAL_BG, padding: '6px 8px', borderLeft: '2px solid '+borderColor, borderBottom: '1px solid '+borderColor, fontSize: 11, textAlign: 'center', fontWeight: 700, minWidth: 80 }}>Grand Total</th>
                {!isNew && <th style={{ background: TOTAL_BG, padding: '6px 8px', borderBottom: '1px solid '+borderColor, fontSize: 11, textAlign: 'center', fontWeight: 700, minWidth: 60 }}>Share %</th>}
              </tr>
              <tr>
                <th style={{ ...TH_CATEGORY(GREY), padding: '5px 8px', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid '+borderColor, fontSize: 11, fontWeight: 700 }}>Category</th>
                <th style={{ ...TH_DIVISION_OTHER(GREY), padding: '5px 8px', borderBottom: '2px solid '+borderColor, fontSize: 11, fontWeight: 700 }}>Division</th>
                {days.map(d => {
                  const expanded = isDayExpanded(d);
                  const dateLabel = `${d} ${parsedMY.shortMonth}`;
                  if (expanded) {
                    return (
                      <React.Fragment key={d}>
                        <th style={{ background: WHITE, padding: '5px 4px', borderRight: '1px solid #e2e8f0', borderBottom: '2px solid '+borderColor, fontSize: 10, textAlign: 'center', fontWeight: 700, minWidth: 60 }}>{d} Amz</th>
                        <th style={{ background: WHITE, padding: '5px 4px', borderRight: '1px solid #e2e8f0', borderBottom: '2px solid '+borderColor, fontSize: 10, textAlign: 'center', fontWeight: 700, minWidth: 60 }}>{d} Coco</th>
                        <th style={{ background: WHITE, padding: '5px 4px', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid '+borderColor, fontSize: 10, textAlign: 'center', fontWeight: 700, minWidth: 60 }}>{d} FBA</th>
                      </React.Fragment>
                    );
                  }
                  return <th key={d} style={{ background: hBg, padding: '5px 4px', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid '+borderColor, fontSize: 10, textAlign: 'center', fontWeight: 800, minWidth: 65 }}>{dateLabel}</th>;
                })}
                <th style={{ background: TOTAL_BG, padding: '5px 8px', borderLeft: '2px solid '+borderColor, borderBottom: '2px solid '+borderColor, fontSize: 11, textAlign: 'center', fontWeight: 700 }}>Total Units</th>
                {!isNew && <th style={{ background: TOTAL_BG, padding: '5px 8px', borderBottom: '2px solid '+borderColor, fontSize: 11, textAlign: 'center', fontWeight: 700 }}>% Share</th>}
              </tr>
            </thead>

            <tbody>
              {categories.map(cat => {
                const dm = lookup.get(cat.name);
                let rowTotal = 0;
                days.forEach(d => {
                  const r = dm?.get(d);
                  if (r) rowTotal += isNew ? (r.amzN + r.cocoN + r.fbaN) : (r.amz + r.coco + r.fba);
                });
                const share = grandTotal > 0 ? ((rowTotal / grandTotal) * 100).toFixed(1) + '%' : '0.0%';

                return (
                  <tr key={cat.name} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ ...TD_CATEGORY(WHITE), padding: '5px 8px', borderRight: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{cat.name}</td>
                    <td style={{ ...TD_DIVISION_OTHER(WHITE), padding: '5px 8px', fontSize: 11, color: '#64748b' }}>{cat.division}</td>
                    {days.map(d => {
                      const expanded = isDayExpanded(d);
                      const r = dm?.get(d);
                      const a = isNew ? (r?.amzN || 0) : (r?.amz || 0);
                      const c = isNew ? (r?.cocoN || 0) : (r?.coco || 0);
                      const f = isNew ? (r?.fbaN || 0) : (r?.fba || 0);
                      const tot = a + c + f;
                      if (expanded) {
                        return (
                          <React.Fragment key={d}>
                            <td style={{ padding: '5px 4px', textAlign: 'center', fontSize: 11, color: a ? '#0f172a' : '#94a3b8', borderRight: '1px solid #f1f5f9' }}>{a || '–'}</td>
                            <td style={{ padding: '5px 4px', textAlign: 'center', fontSize: 11, color: c ? '#0f172a' : '#94a3b8', borderRight: '1px solid #f1f5f9' }}>{c || '–'}</td>
                            <td style={{ padding: '5px 4px', textAlign: 'center', fontSize: 11, color: f ? '#0f172a' : '#94a3b8', borderRight: '1px solid #e2e8f0' }}>{f || '–'}</td>
                          </React.Fragment>
                        );
                      }
                      return <td key={d} style={{ padding: '5px 4px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: tot ? '#92400e' : '#94a3b8', background: tot ? '#fffbeb' : WHITE, borderRight: '1px solid #e2e8f0' }}>{tot || '–'}</td>;
                    })}
                    <td style={{ background: TOTAL_BG, padding: '5px 8px', textAlign: 'center', fontSize: 11, fontWeight: 700, borderLeft: '2px solid #94a3b8', color: '#0f172a' }}>{rowTotal}</td>
                    {!isNew && <td style={{ background: TOTAL_BG, padding: '5px 8px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{share}</td>}
                  </tr>
                );
              })}
              <tr style={{ borderTop: '2px solid #94a3b8', background: TOTAL_BG }}>
                <td style={{ ...TD_CATEGORY(TOTAL_BG), padding: '6px 8px', borderRight: '1px solid #94a3b8', fontSize: 11, fontWeight: 800 }}>Grand Total</td>
                <td style={{ ...TD_DIVISION_OTHER(TOTAL_BG), padding: '6px 8px', fontSize: 11 }}>–</td>
                {days.map(d => {
                  const expanded = isDayExpanded(d);
                  if (expanded) {
                    const kA = isNew ? dayTotals[d].amzN : dayTotals[d].amz;
                    const kC = isNew ? dayTotals[d].cocoN : dayTotals[d].coco;
                    const kF = isNew ? dayTotals[d].fbaN : dayTotals[d].fba;
                    return (
                      <React.Fragment key={d}>
                        <td style={{ padding: '6px 4px', textAlign: 'center', fontSize: 11, fontWeight: 800, borderRight: '1px solid #e2e8f0' }}>{kA}</td>
                        <td style={{ padding: '6px 4px', textAlign: 'center', fontSize: 11, fontWeight: 800, borderRight: '1px solid #e2e8f0' }}>{kC}</td>
                        <td style={{ padding: '6px 4px', textAlign: 'center', fontSize: 11, fontWeight: 800, borderRight: '1px solid #e2e8f0' }}>{kF}</td>
                      </React.Fragment>
                    );
                  }
                  const tot = isNew ? dayTotals[d].totalN : dayTotals[d].total;
                  return <td key={d} style={{ padding: '6px 4px', textAlign: 'center', fontSize: 12, fontWeight: 900, color: '#92400e', borderRight: '1px solid #e2e8f0' }}>{tot}</td>;
                })}
                <td style={{ background: TOTAL_BG, padding: '6px 8px', textAlign: 'center', fontSize: 12, fontWeight: 900, borderLeft: '2px solid #94a3b8', color: '#0f172a' }}>{isNew ? grandTotalNew : grandTotal}</td>
                {!isNew && <td style={{ background: TOTAL_BG, padding: '6px 8px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#0f172a' }}>100%</td>}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Compute division totals for summary cards
  let fwTotal = 0, apTotal = 0;
  categories.forEach(c => {
    const dm = lookup.get(c.name);
    days.forEach(d => {
      const r = dm?.get(d);
      if (r) {
        const tot = r.amz + r.coco + r.fba;
        if (c.division === 'FOOTWEAR') fwTotal += tot;
        else apTotal += tot;
      }
    });
  });

  return (
    <div className="space-y-8">
      {renderSalesTable(false)}
      {renderSalesTable(true)}
      <SummaryCards
        grandTotal={grandTotal}
        grandTotalNew={grandTotalNew}
        fwTotal={fwTotal}
        apTotal={apTotal}
      />
    </div>
  );
}

// ============================================================================
// REST CHANNEL SHEETS (Ajio, Nykaa, FirstCry, Flipkart, D2C)
// ============================================================================
function RestChannelSheets({
  days, parsedMY, stats, marketplaceName
}: {
  days: number[];
  parsedMY: ParsedMonthYear;
  stats: DailyCategoryStat[];
  marketplaceName: string;
}) {
  const [isFullScreenSales, setIsFullScreenSales] = useState(false);
  const [isFullScreenNew, setIsFullScreenNew] = useState(false);

  const categories = [...FOOTWEAR_CATEGORIES, ...APPAREL_CATEGORIES];

  type DayRec = { total: number; newUnits: number };
  const lookup = new Map<string, Map<number, DayRec>>();
  stats.forEach(s => {
    if (!lookup.has(s.category)) lookup.set(s.category, new Map());
    const dm = lookup.get(s.category)!;
    if (!dm.has(s.day)) dm.set(s.day, { total: 0, newUnits: 0 });
    const r = dm.get(s.day)!;
    r.total += s.totalUnits;
    r.newUnits += s.newStyleUnits;
  });

  const dayTotals: Record<number, DayRec> = {};
  days.forEach(d => { dayTotals[d] = { total: 0, newUnits: 0 }; });
  categories.forEach(c => {
    const dm = lookup.get(c.name);
    days.forEach(d => {
      const r = dm?.get(d);
      if (r) { dayTotals[d].total += r.total; dayTotals[d].newUnits += r.newUnits; }
    });
  });
  const grandTotal    = Object.values(dayTotals).reduce((a, b) => a + b.total, 0);
  const grandTotalNew = Object.values(dayTotals).reduce((a, b) => a + b.newUnits, 0);

  const HEADER_BG = '#d9e1f2';
  const HEADER2_BG = '#b4c6e7';
  const TOTAL_BG  = '#fff2cc';
  const WHITE     = '#ffffff';
  const GREY      = '#f2f2f2';

  function renderTable(isNew: boolean) {
    const isFullScreen = isNew ? isFullScreenNew : isFullScreenSales;
    const setIsFullScreen = isNew ? setIsFullScreenNew : setIsFullScreenSales;
    const hBg = isNew ? '#dce6f1' : HEADER_BG;
    const h2Bg = isNew ? '#b8cce4' : HEADER2_BG;

    return (
      <div className={`rounded-2xl border border-slate-200 shadow-sm overflow-hidden bg-white transition-all ${
        isFullScreen ? 'fixed inset-0 z-50 rounded-none p-4 sm:p-6 flex flex-col' : ''
      }`}>
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-black text-xs text-blue-900 uppercase tracking-wide">
              {marketplaceName} — {isNew ? `New Contribution Sheet (${parsedMY.monthName} ${parsedMY.year})` : `Monthly Sales Sheet (${parsedMY.monthName} ${parsedMY.year})`}
            </span>
            <span className="text-[11px] text-blue-700 hidden sm:inline">· Category · Division → Frozen</span>
          </div>

          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-xs transition-all active:scale-95"
          >
            {isFullScreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Fullscreen</span>
              </>
            )}
          </button>
        </div>

        <div className={`overflow-auto ${isFullScreen ? 'flex-1 max-h-none' : 'max-h-[65vh]'}`} style={{ position: 'relative' }}>
          <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: '100%' }}>
            <colgroup>
              <col style={{ width: COL_CATEGORY_W }} />
              <col style={{ width: COL_DIVISION_W }} />
            </colgroup>

            <thead style={{ position: 'sticky', top: 0, zIndex: 30 }}>
              <tr>
                <th style={{ ...TH_CATEGORY(hBg), padding: '6px 8px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #94a3b8', fontSize: 11 }}>Category Level</th>
                <th style={{ ...TH_DIVISION_OTHER(hBg), padding: '6px 8px', borderBottom: '1px solid #94a3b8', fontSize: 11 }}>Division</th>
                {days.map(d => {
                  const weekdayName = getRealWeekdayName(parsedMY.year, parsedMY.monthIndex, d);
                  return (
                    <th key={d} style={{ background: h2Bg, padding: '6px 4px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #94a3b8', fontSize: 10, textAlign: 'center', fontWeight: 700, minWidth: 65 }}>
                      {weekdayName}
                    </th>
                  );
                })}
                <th style={{ background: TOTAL_BG, padding: '6px 8px', borderLeft: '2px solid #94a3b8', borderBottom: '1px solid #94a3b8', fontSize: 11, textAlign: 'center', fontWeight: 700, minWidth: 80 }}>Grand Total</th>
                {!isNew && <th style={{ background: TOTAL_BG, padding: '6px 8px', borderBottom: '1px solid #94a3b8', fontSize: 11, textAlign: 'center', fontWeight: 700, minWidth: 60 }}>Share %</th>}
              </tr>
              <tr>
                <th style={{ ...TH_CATEGORY(GREY), padding: '5px 8px', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #94a3b8', fontSize: 11, fontWeight: 700 }}>Category</th>
                <th style={{ ...TH_DIVISION_OTHER(GREY), padding: '5px 8px', borderBottom: '2px solid #94a3b8', fontSize: 11, fontWeight: 700 }}>Division</th>
                {days.map(d => {
                  const dateLabel = `${d} ${parsedMY.shortMonth}`;
                  return (
                    <th key={d} style={{ background: hBg, padding: '5px 4px', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #94a3b8', fontSize: 10, textAlign: 'center', fontWeight: 800, minWidth: 65 }}>
                      {dateLabel}
                    </th>
                  );
                })}
                <th style={{ background: TOTAL_BG, padding: '5px 8px', borderLeft: '2px solid #94a3b8', borderBottom: '2px solid #94a3b8', fontSize: 11, textAlign: 'center', fontWeight: 700 }}>Total Units</th>
                {!isNew && <th style={{ background: TOTAL_BG, padding: '5px 8px', borderBottom: '2px solid #94a3b8', fontSize: 11, textAlign: 'center', fontWeight: 700 }}>% Share</th>}
              </tr>
            </thead>

            <tbody>
              {categories.map(cat => {
                const dm = lookup.get(cat.name);
                let rowTotal = 0;
                days.forEach(d => { const r = dm?.get(d); if (r) rowTotal += isNew ? r.newUnits : r.total; });
                const share = grandTotal > 0 ? ((rowTotal / grandTotal) * 100).toFixed(1) + '%' : '0.0%';

                return (
                  <tr key={cat.name} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ ...TD_CATEGORY(WHITE), padding: '5px 8px', borderRight: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{cat.name}</td>
                    <td style={{ ...TD_DIVISION_OTHER(WHITE), padding: '5px 8px', fontSize: 11, color: '#64748b' }}>{cat.division}</td>
                    {days.map(d => {
                      const r = dm?.get(d);
                      const val = isNew ? (r?.newUnits || 0) : (r?.total || 0);
                      return <td key={d} style={{ padding: '5px 4px', textAlign: 'center', fontSize: 11, fontWeight: val ? 700 : 400, color: val ? '#1e40af' : '#94a3b8', background: val ? '#eff6ff' : WHITE, borderRight: '1px solid #e2e8f0' }}>{val || '–'}</td>;
                    })}
                    <td style={{ background: TOTAL_BG, padding: '5px 8px', textAlign: 'center', fontSize: 11, fontWeight: 700, borderLeft: '2px solid #94a3b8', color: '#0f172a' }}>{rowTotal}</td>
                    {!isNew && <td style={{ background: TOTAL_BG, padding: '5px 8px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{share}</td>}
                  </tr>
                );
              })}
              <tr style={{ borderTop: '2px solid #94a3b8', background: TOTAL_BG }}>
                <td style={{ ...TD_CATEGORY(TOTAL_BG), padding: '6px 8px', borderRight: '1px solid #94a3b8', fontSize: 11, fontWeight: 800 }}>Grand Total</td>
                <td style={{ ...TD_DIVISION_OTHER(TOTAL_BG), padding: '6px 8px', fontSize: 11 }}>–</td>
                {days.map(d => {
                  const tot = isNew ? dayTotals[d].newUnits : dayTotals[d].total;
                  return <td key={d} style={{ padding: '6px 4px', textAlign: 'center', fontSize: 12, fontWeight: 900, color: '#1e40af', borderRight: '1px solid #e2e8f0' }}>{tot}</td>;
                })}
                <td style={{ background: TOTAL_BG, padding: '6px 8px', textAlign: 'center', fontSize: 12, fontWeight: 900, borderLeft: '2px solid #94a3b8', color: '#0f172a' }}>{isNew ? grandTotalNew : grandTotal}</td>
                {!isNew && <td style={{ background: TOTAL_BG, padding: '6px 8px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#0f172a' }}>100%</td>}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Compute division totals for summary cards
  let fwTotal = 0, apTotal = 0;
  categories.forEach(c => {
    const dm = lookup.get(c.name);
    days.forEach(d => {
      const r = dm?.get(d);
      if (r) {
        if (c.division === 'FOOTWEAR') fwTotal += r.total;
        else apTotal += r.total;
      }
    });
  });

  return (
    <div className="space-y-8">
      {renderTable(false)}
      {renderTable(true)}
      <SummaryCards
        grandTotal={grandTotal}
        grandTotalNew={grandTotalNew}
        fwTotal={fwTotal}
        apTotal={apTotal}
      />
    </div>
  );
}
