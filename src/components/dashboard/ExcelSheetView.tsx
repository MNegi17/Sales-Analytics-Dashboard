import React, { useState } from 'react';
import { DailyCategoryStat, MarketplaceId } from '../../types';
import { MARKETPLACE_CONFIGS, FOOTWEAR_CATEGORIES, APPAREL_CATEGORIES } from '../../engine/constants';
import { generateMonthlyExcelWorkbook } from '../../engine/exporter';
import { useSalesStore } from '../../store/useSalesStore';

// ─── Frozen column pixel widths ─────────────────────────────────────────────
const COL_CATEGORY_W  = 160; // px – "Category" column
const COL_STYLE_W     = 100; // px – "Style Count" column
const COL_DIVISION_W  = 110; // px – "Division" column

const LEFT_CATEGORY   = 0;
const LEFT_STYLE      = LEFT_CATEGORY + COL_CATEGORY_W;   // 160
const LEFT_DIVISION   = LEFT_STYLE    + COL_STYLE_W;      // 260

const stickyStyle = (left: number, bg: string, zIndex = 20): React.CSSProperties => ({
  position: 'sticky',
  left,
  zIndex,
  background: bg,
  boxShadow: left === LEFT_DIVISION ? '2px 0 4px -2px rgba(0,0,0,0.12)' : undefined,
});

const TH_CATEGORY  = (bg: string): React.CSSProperties => ({ ...stickyStyle(LEFT_CATEGORY,  bg, 40), width: COL_CATEGORY_W,  minWidth: COL_CATEGORY_W });
const TH_STYLE     = (bg: string): React.CSSProperties => ({ ...stickyStyle(LEFT_STYLE,     bg, 40), width: COL_STYLE_W,     minWidth: COL_STYLE_W });
const TH_DIVISION  = (bg: string): React.CSSProperties => ({ ...stickyStyle(LEFT_DIVISION,  bg, 40), width: COL_DIVISION_W,  minWidth: COL_DIVISION_W, boxShadow: '3px 0 6px -3px rgba(0,0,0,0.15)' });

const TD_CATEGORY  = (bg: string): React.CSSProperties => ({ ...stickyStyle(LEFT_CATEGORY,  bg, 20), width: COL_CATEGORY_W,  minWidth: COL_CATEGORY_W });
const TD_STYLE     = (bg: string): React.CSSProperties => ({ ...stickyStyle(LEFT_STYLE,     bg, 20), width: COL_STYLE_W,     minWidth: COL_STYLE_W });
const TD_DIVISION  = (bg: string): React.CSSProperties => ({ ...stickyStyle(LEFT_DIVISION,  bg, 20), width: COL_DIVISION_W,  minWidth: COL_DIVISION_W, boxShadow: '3px 0 6px -3px rgba(0,0,0,0.15)' });

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
  const parts = monthYearStr.trim().split(/\s+/);
  const mName = parts[0] || 'August';
  const year = parseInt(parts[1], 10) || 2026;

  let mIdx = MONTH_NAMES.findIndex(m => m.toLowerCase() === mName.toLowerCase());
  if (mIdx === -1) {
    mIdx = SHORT_MONTH_NAMES.findIndex(m => m.toLowerCase() === mName.toLowerCase());
  }
  if (mIdx === -1) mIdx = 7; // Default August

  const daysInMonth = new Date(year, mIdx + 1, 0).getDate();

  return {
    monthIndex: mIdx,
    monthName: MONTH_NAMES[mIdx],
    shortMonth: SHORT_MONTH_NAMES[mIdx],
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
  
  // Add New Month Modal State
  const [isAddMonthOpen, setIsAddMonthOpen] = useState(false);
  const [newMonthSelect, setNewMonthSelect] = useState('July');
  const [newYearSelect, setNewYearSelect] = useState('2026');

  const currentConfig = MARKETPLACE_CONFIGS[activeMarketplace];

  // Combined list of months
  const availableMonthsSet = new Set<string>(customMonths);
  availableMonthsSet.add('May 2026');
  availableMonthsSet.add('June 2026');
  availableMonthsSet.add('July 2026');
  availableMonthsSet.add('August 2026');
  stats.forEach(s => availableMonthsSet.add(s.monthYearKey));
  const availableMonths = Array.from(availableMonthsSet);

  const parsedMY = parseMonthYear(selectedMonthYear);

  const filteredStats = stats.filter(
    s => s.monthYearKey === selectedMonthYear && s.marketplaceId === activeMarketplace
  );

  // Generate days 1..daysInMonth
  const days = Array.from({ length: parsedMY.daysInMonth }, (_, i) => i + 1);

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
    <div className="space-y-8 pb-12">

      {/* ── Toolbar ── */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">

        {/* Marketplace Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
          {Object.values(MARKETPLACE_CONFIGS).map(mp => {
            const isActive = mp.id === activeMarketplace;
            return (
              <button
                key={mp.id}
                onClick={() => setActiveMarketplace(mp.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex-shrink-0 flex items-center space-x-1.5 border ${
                  isActive
                    ? 'bg-sky-600 text-white border-sky-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{mp.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>{mp.structure === 'STRUCTURE_A' ? 'A' : 'B'}</span>
              </button>
            );
          })}
        </div>

        {/* Right Controls */}
        <div className="flex flex-wrap items-center space-x-3 w-full lg:w-auto justify-end gap-y-2">
          {currentConfig.structure === 'STRUCTURE_A' && (
            <button
              onClick={() => setIsExpandedGlobal(!isExpandedGlobal)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs flex items-center space-x-1.5"
            >
              <span className="px-1 py-0.5 rounded bg-slate-200 font-mono text-[11px] font-black">
                {isExpandedGlobal ? '−' : '+'}
              </span>
              <span>{isExpandedGlobal ? 'Collapse to Totals' : 'Expand Sub-Channels'}</span>
            </button>
          )}

          {/* Month Selector */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-semibold text-slate-600">Month:</span>
            <select
              value={selectedMonthYear}
              onChange={e => onMonthChange(e.target.value)}
              className="px-3 py-1.5 rounded-lg clean-input text-xs font-bold"
            >
              {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Add New Month Button */}
          <button
            onClick={() => setIsAddMonthOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center space-x-1 shadow-xs"
          >
            <span>+ Add New Month</span>
          </button>

          <button
            onClick={handleDownloadExcel}
            disabled={isDownloading}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
          >
            {isDownloading ? 'Downloading...' : 'Download Excel'}
          </button>
        </div>
      </div>

      {/* ── ADD NEW MONTH MODAL ── */}
      {isAddMonthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl p-6 w-full max-w-sm space-y-4">
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
                  className="w-full p-2 rounded-lg clean-input text-xs font-bold"
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
                  className="w-full p-2 rounded-lg clean-input text-xs font-bold"
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

      {/* ── Sheets ── */}
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
          myntraStyleCounts={myntraStyleCounts}
          isExpandedGlobal={isExpandedGlobal}
        />
      )}
      {activeMarketplace !== 'myntra' && activeMarketplace !== 'amazon' && (
        <RestChannelSheets
          days={days}
          parsedMY={parsedMY}
          stats={filteredStats}
          marketplaceName={currentConfig.name}
          myntraStyleCounts={myntraStyleCounts}
        />
      )}
    </div>
  );
};

// ============================================================================
// MYNTRA SHEETS
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
      <div className="rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
          <span className="font-extrabold text-xs text-emerald-900 uppercase tracking-wide">
            Myntra + SJIT — Monthly Sales Sheet ({parsedMY.monthName} {parsedMY.year})
          </span>
          <span className="text-[11px] text-emerald-700">Category · Style Count · Division → Frozen</span>
        </div>

        <div className="overflow-auto max-h-[65vh]" style={{ position: 'relative' }}>
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
                <th style={{ ...TH_DIVISION(HEADER_BG), padding: '6px 8px', borderBottom: '1px solid #94a3b8', fontSize: 11 }}>Division</th>

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
                <th style={{ ...TH_DIVISION(GREY), padding: '5px 8px', borderBottom: '2px solid #94a3b8', fontSize: 11, fontWeight: 700 }}>Division</th>

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
                    <td style={{ ...TD_DIVISION(WHITE), padding: '5px 8px', fontSize: 11, color: '#64748b' }}>{cat.division}</td>

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
                <td style={{ ...TD_DIVISION(TOTAL_BG), padding: '6px 8px', fontSize: 11, color: '#475569' }}>–</td>

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
      <div className="rounded-xl border border-rose-200 shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
          <span className="font-extrabold text-xs text-rose-900 uppercase tracking-wide">
            Myntra + SJIT — New Contribution Sheet ({parsedMY.monthName} {parsedMY.year})
          </span>
          <span className="text-[11px] text-rose-700">Calculated from "New" column entries</span>
        </div>

        <div className="overflow-auto max-h-[65vh]" style={{ position: 'relative' }}>
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
                <th style={{ ...TH_DIVISION('#fce4d6'), padding: '6px 8px', borderBottom: '1px solid #94a3b8', fontSize: 11 }}>Division</th>
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
                <th style={{ ...TH_DIVISION(GREY), padding: '5px 8px', borderBottom: '2px solid #94a3b8', fontSize: 11, fontWeight: 700 }}>Division</th>
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
                    <td style={{ ...TD_DIVISION(WHITE), padding: '5px 8px', fontSize: 11, color: '#64748b' }}>{cat.division}</td>
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
                <td style={{ ...TD_DIVISION('#fce4d6'), padding: '6px 8px', fontSize: 11 }}>–</td>
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
// AMAZON SHEETS
// ============================================================================
function AmazonSheets({
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
    const title = isNew ? `Amazon + Cocoblu + FBA — New Contribution Sheet (${parsedMY.monthName} ${parsedMY.year})` : `Amazon + Cocoblu + FBA — Monthly Sales Sheet (${parsedMY.monthName} ${parsedMY.year})`;
    const hBg = isNew ? '#fce4d6' : HEADER_BG;
    const h2Bg = isNew ? '#f8cbad' : HEADER2_BG;
    const borderColor = isNew ? '#fda4af' : '#94a3b8';

    return (
      <div className={`rounded-xl border shadow-sm overflow-hidden ${isNew ? 'border-amber-200' : 'border-slate-200'}`}>
        <div className={`px-4 py-2.5 flex items-center justify-between ${isNew ? 'bg-amber-50 border-b border-amber-200' : 'bg-amber-50 border-b border-amber-200'}`}>
          <span className="font-extrabold text-xs text-amber-900 uppercase tracking-wide">{title}</span>
          <span className="text-[11px] text-amber-700">Category · Style Count · Division → Frozen</span>
        </div>

        <div className="overflow-auto max-h-[65vh]" style={{ position: 'relative' }}>
          <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: '100%' }}>
            <colgroup>
              <col style={{ width: COL_CATEGORY_W }} />
              <col style={{ width: COL_STYLE_W }} />
              <col style={{ width: COL_DIVISION_W }} />
            </colgroup>

            <thead style={{ position: 'sticky', top: 0, zIndex: 30 }}>
              <tr>
                <th style={{ ...TH_CATEGORY(hBg), padding: '6px 8px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid '+borderColor, fontSize: 11 }}>Category Level</th>
                <th style={{ ...TH_STYLE(hBg),    padding: '6px 8px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid '+borderColor, fontSize: 11, textAlign: 'center' }}>Style Count</th>
                <th style={{ ...TH_DIVISION(hBg), padding: '6px 8px', borderBottom: '1px solid '+borderColor, fontSize: 11 }}>Division</th>
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
                <th style={{ ...TH_STYLE(GREY),    padding: '5px 8px', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid '+borderColor, fontSize: 11, fontWeight: 700, textAlign: 'center' }}>Online Style</th>
                <th style={{ ...TH_DIVISION(GREY), padding: '5px 8px', borderBottom: '2px solid '+borderColor, fontSize: 11, fontWeight: 700 }}>Division</th>
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
                const sc = myntraStyleCounts[cat.name] ?? (cat as any).defaultMyntraStyleCount ?? 0;
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
                    <td style={{ ...TD_STYLE(WHITE),    padding: '5px 8px', borderRight: '1px solid #e2e8f0', fontSize: 11, textAlign: 'center', color: '#475569' }}>{sc}</td>
                    <td style={{ ...TD_DIVISION(WHITE), padding: '5px 8px', fontSize: 11, color: '#64748b' }}>{cat.division}</td>
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
                <td style={{ ...TD_STYLE(TOTAL_BG),    padding: '6px 8px', borderRight: '1px solid #94a3b8', fontSize: 11, textAlign: 'center' }}>–</td>
                <td style={{ ...TD_DIVISION(TOTAL_BG), padding: '6px 8px', fontSize: 11 }}>–</td>
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
  days, parsedMY, stats, marketplaceName, myntraStyleCounts
}: {
  days: number[];
  parsedMY: ParsedMonthYear;
  stats: DailyCategoryStat[];
  marketplaceName: string;
  myntraStyleCounts: Record<string, number>;
}) {
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
    const hBg = isNew ? '#dce6f1' : HEADER_BG;
    const h2Bg = isNew ? '#b8cce4' : HEADER2_BG;

    return (
      <div className="rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
          <span className="font-extrabold text-xs text-blue-900 uppercase tracking-wide">
            {marketplaceName} — {isNew ? `New Contribution Sheet (${parsedMY.monthName} ${parsedMY.year})` : `Monthly Sales Sheet (${parsedMY.monthName} ${parsedMY.year})`}
          </span>
          <span className="text-[11px] text-blue-700">Category · Style Count · Division → Frozen</span>
        </div>

        <div className="overflow-auto max-h-[65vh]" style={{ position: 'relative' }}>
          <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: '100%' }}>
            <colgroup>
              <col style={{ width: COL_CATEGORY_W }} />
              <col style={{ width: COL_STYLE_W }} />
              <col style={{ width: COL_DIVISION_W }} />
            </colgroup>

            <thead style={{ position: 'sticky', top: 0, zIndex: 30 }}>
              <tr>
                <th style={{ ...TH_CATEGORY(hBg), padding: '6px 8px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #94a3b8', fontSize: 11 }}>Category Level</th>
                <th style={{ ...TH_STYLE(hBg),    padding: '6px 8px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #94a3b8', fontSize: 11, textAlign: 'center' }}>Style Count</th>
                <th style={{ ...TH_DIVISION(hBg), padding: '6px 8px', borderBottom: '1px solid #94a3b8', fontSize: 11 }}>Division</th>
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
                <th style={{ ...TH_STYLE(GREY),    padding: '5px 8px', borderRight: '1px solid #cbd5e1', borderBottom: '2px solid #94a3b8', fontSize: 11, fontWeight: 700, textAlign: 'center' }}>Online Style</th>
                <th style={{ ...TH_DIVISION(GREY), padding: '5px 8px', borderBottom: '2px solid #94a3b8', fontSize: 11, fontWeight: 700 }}>Division</th>
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
                const sc = myntraStyleCounts[cat.name] ?? (cat as any).defaultMyntraStyleCount ?? 0;
                const dm = lookup.get(cat.name);
                let rowTotal = 0;
                days.forEach(d => { const r = dm?.get(d); if (r) rowTotal += isNew ? r.newUnits : r.total; });
                const share = grandTotal > 0 ? ((rowTotal / grandTotal) * 100).toFixed(1) + '%' : '0.0%';

                return (
                  <tr key={cat.name} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ ...TD_CATEGORY(WHITE), padding: '5px 8px', borderRight: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{cat.name}</td>
                    <td style={{ ...TD_STYLE(WHITE),    padding: '5px 8px', borderRight: '1px solid #e2e8f0', fontSize: 11, textAlign: 'center', color: '#475569' }}>{sc}</td>
                    <td style={{ ...TD_DIVISION(WHITE), padding: '5px 8px', fontSize: 11, color: '#64748b' }}>{cat.division}</td>
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
                <td style={{ ...TD_STYLE(TOTAL_BG),    padding: '6px 8px', borderRight: '1px solid #94a3b8', fontSize: 11, textAlign: 'center' }}>–</td>
                <td style={{ ...TD_DIVISION(TOTAL_BG), padding: '6px 8px', fontSize: 11 }}>–</td>
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
