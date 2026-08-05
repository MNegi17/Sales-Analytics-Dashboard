import { create } from 'zustand';
import { 
  DailyCategoryStat, 
  UploadBatchLog, 
  DuplicateConflict, 
  DuplicateResolution,
  MarketplaceId
} from '../types';
import { parseSalesExcelFile } from '../engine/excel-parser';
import { aggregateSalesData } from '../engine/processor';
import { validateSalesData } from '../engine/validator';
import { FOOTWEAR_CATEGORIES, APPAREL_CATEGORIES } from '../engine/constants';

interface SalesStoreState {
  // Data
  dailyStats: DailyCategoryStat[];
  uploadLogs: UploadBatchLog[];
  myntraStyleCounts: Record<string, number>;
  customMonths: string[];
  
  // Active state
  isProcessing: boolean;
  activeConflict: DuplicateConflict | null;
  pendingParsedStats: DailyCategoryStat[] | null;
  pendingLog: Partial<UploadBatchLog> | null;

  // Filters
  selectedMonthYear: string;
  selectedMarketplace: string; // 'ALL' or MarketplaceId
  searchQuery: string;

  // Actions
  processUploadedFile: (file: File) => Promise<{ success: boolean; conflict?: DuplicateConflict; message?: string }>;
  applyDuplicateResolution: (resolution: DuplicateResolution) => void;
  updateMyntraStyleCount: (category: string, count: number) => void;
  addCustomMonth: (monthYear: string) => void;
  setSelectedMonthYear: (monthYear: string) => void;
  setSelectedMarketplace: (mp: string) => void;
  setSearchQuery: (q: string) => void;
  resetAllData: () => void;
}

// Initial Myntra style counts setup
const initialStyleCounts: Record<string, number> = {};
[...FOOTWEAR_CATEGORIES, ...APPAREL_CATEGORIES].forEach(c => {
  if (c.defaultMyntraStyleCount !== undefined) {
    initialStyleCounts[c.name] = c.defaultMyntraStyleCount;
  }
});

export const useSalesStore = create<SalesStoreState>((set, get) => ({
  dailyStats: [],
  uploadLogs: [],
  myntraStyleCounts: initialStyleCounts,
  customMonths: ['May 2026', 'June 2026', 'July 2026', 'August 2026'],
  
  isProcessing: false,
  activeConflict: null,
  pendingParsedStats: null,
  pendingLog: null,

  selectedMonthYear: 'August 2026',
  selectedMarketplace: 'ALL',
  searchQuery: '',

  processUploadedFile: async (file: File) => {
    set({ isProcessing: true });
    const startTime = performance.now();

    try {
      const parseResult = await parseSalesExcelFile(file);
      const validationReport = validateSalesData(parseResult.rows);
      const newStats = aggregateSalesData(parseResult.rows);

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      const currentStats = get().dailyStats;

      // Check for date/marketplace conflicts
      const existingDateKeys = new Set(currentStats.map(s => `${s.marketplaceId}_${s.dateKey}`));
      const newDateKeys = new Set(newStats.map(s => `${s.marketplaceId}_${s.dateKey}`));

      let hasConflict = false;
      const conflictingDates: string[] = [];

      newDateKeys.forEach(dk => {
        if (existingDateKeys.has(dk)) {
          hasConflict = true;
          conflictingDates.push(dk);
        }
      });

      const logEntry: Partial<UploadBatchLog> = {
        id: `UPL-${Date.now()}`,
        fileName: file.name,
        uploadTimestamp: new Date().toLocaleString(),
        dateRange: parseResult.dateRange,
        marketplacesDetected: parseResult.marketplacesDetected,
        rowsProcessed: parseResult.totalRawRows,
        duplicateCount: validationReport.duplicateRowsCount,
        errorCount: parseResult.errors.length + validationReport.errors.length,
        processingTimeMs: duration,
        errors: [...parseResult.errors, ...validationReport.errors]
      };

      if (hasConflict) {
        set({
          isProcessing: false,
          activeConflict: {
            dateKey: conflictingDates.join(', '),
            marketplaceId: parseResult.marketplacesDetected[0] || 'myntra',
            existingCount: currentStats.length,
            newCount: newStats.length,
            categoriesAffected: Array.from(new Set(newStats.map(s => s.category)))
          },
          pendingParsedStats: newStats,
          pendingLog: logEntry
        });

        return { success: false, conflict: get().activeConflict! };
      }

      // No conflict: Directly insert
      const updatedStats = [...currentStats, ...newStats];
      const completedLog: UploadBatchLog = {
        ...logEntry,
        rowsInserted: newStats.length,
        rowsUpdated: 0,
        rowsSkipped: 0,
        status: parseResult.errors.length > 0 ? 'WARNING' : 'SUCCESS'
      } as UploadBatchLog;

      const detectedMonthYear = newStats[0]?.monthYearKey;
      const updatedMonths = detectedMonthYear && !get().customMonths.includes(detectedMonthYear)
        ? [...get().customMonths, detectedMonthYear]
        : get().customMonths;

      set({
        dailyStats: updatedStats,
        uploadLogs: [completedLog, ...get().uploadLogs],
        customMonths: updatedMonths,
        isProcessing: false,
        pendingParsedStats: null,
        pendingLog: null,
        selectedMonthYear: detectedMonthYear || get().selectedMonthYear
      });

      return { success: true, message: `Successfully processed ${parseResult.totalRawRows} rows in ${duration}ms` };

    } catch (err: any) {
      set({ isProcessing: false });
      return { success: false, message: err?.message || 'Error processing file' };
    }
  },

  applyDuplicateResolution: (resolution: DuplicateResolution) => {
    const { pendingParsedStats, pendingLog, dailyStats, uploadLogs } = get();
    if (!pendingParsedStats || !pendingLog) return;

    let newStatsList = [...dailyStats];
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    const pendingKeys = new Set(pendingParsedStats.map(s => `${s.marketplaceId}_${s.dateKey}_${s.subChannel || ''}_${s.category}`));

    if (resolution === 'replace') {
      newStatsList = newStatsList.filter(s => !pendingKeys.has(`${s.marketplaceId}_${s.dateKey}_${s.subChannel || ''}_${s.category}`));
      newStatsList.push(...pendingParsedStats);
      updated = pendingParsedStats.length;
    } else if (resolution === 'merge') {
      const statMap = new Map<string, DailyCategoryStat>();
      newStatsList.forEach(s => statMap.set(`${s.marketplaceId}_${s.dateKey}_${s.subChannel || ''}_${s.category}`, { ...s }));

      pendingParsedStats.forEach(p => {
        const k = `${p.marketplaceId}_${p.dateKey}_${p.subChannel || ''}_${p.category}`;
        if (statMap.has(k)) {
          const existing = statMap.get(k)!;
          existing.totalUnits += p.totalUnits;
          existing.newStyleUnits += p.newStyleUnits;
          updated++;
        } else {
          statMap.set(k, { ...p });
          inserted++;
        }
      });
      newStatsList = Array.from(statMap.values());
    } else if (resolution === 'skip') {
      skipped = pendingParsedStats.length;
    }

    const finalLog: UploadBatchLog = {
      ...pendingLog,
      rowsInserted: inserted,
      rowsUpdated: updated,
      rowsSkipped: skipped,
      status: 'SUCCESS'
    } as UploadBatchLog;

    set({
      dailyStats: newStatsList,
      uploadLogs: [finalLog, ...uploadLogs],
      activeConflict: null,
      pendingParsedStats: null,
      pendingLog: null
    });
  },

  updateMyntraStyleCount: (category: string, count: number) => {
    set(state => ({
      myntraStyleCounts: {
        ...state.myntraStyleCounts,
        [category]: count
      }
    }));
  },

  addCustomMonth: (monthYear: string) => {
    set(state => {
      if (state.customMonths.includes(monthYear)) {
        return { selectedMonthYear: monthYear };
      }
      return {
        customMonths: [...state.customMonths, monthYear],
        selectedMonthYear: monthYear
      };
    });
  },

  setSelectedMonthYear: (monthYear: string) => set({ selectedMonthYear: monthYear }),
  setSelectedMarketplace: (mp: string) => set({ selectedMarketplace: mp }),
  setSearchQuery: (q: string) => set({ searchQuery: q }),

  resetAllData: () => set({
    dailyStats: [],
    uploadLogs: [],
    myntraStyleCounts: initialStyleCounts,
    customMonths: ['May 2026', 'June 2026', 'July 2026', 'August 2026'],
    activeConflict: null,
    pendingParsedStats: null,
    pendingLog: null
  })
}));
