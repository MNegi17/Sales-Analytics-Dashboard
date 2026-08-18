export type MarketplaceId = 
  | 'myntra'
  | 'amazon'
  | 'ajio'
  | 'nykaa'
  | 'firstcry'
  | 'flipkart'
  | 'd2c';

export type TemplateStructure = 'STRUCTURE_A' | 'STRUCTURE_B';

export interface MarketplaceConfig {
  id: MarketplaceId;
  name: string;
  channels: string[]; // Raw Channel Name strings in uploaded files
  structure: TemplateStructure;
  iconName: string;
  badgeColor: string;
  subChannels?: string[];
}

export interface RawSaleRow {
  skuCode: string;
  division: 'FOOTWEAR' | 'APPAREL' | 'ACCESSORIES' | string;
  category: string;
  subcategory: string;
  isNew: boolean;
  channelName: string;
  orderDate: Date | string;
  formattedDate: string; // YYYY-MM-DD
  dayOfMonth: number;    // 1-31
  monthName: string;     // e.g. "August"
  monthYearKey: string;  // e.g. "August 2026"
  year: number;
  saleOrderCode?: string;
  price?: number;
}

export interface DailyCategoryStat {
  marketplaceId: MarketplaceId;
  channelName: string;
  subChannel?: string; // e.g. "PPMP" / "SJIT" for Myntra, "Amazon" / "Cocoblu" / "FBA" for Amazon
  dateKey: string;     // YYYY-MM-DD
  monthYearKey: string;// "August 2026"
  year: number;
  month: string;       // "August"
  day: number;         // 1-31
  category: string;
  division: string;
  totalUnits: number;
  newStyleUnits: number;
}

export type DuplicateResolution = 'replace' | 'merge' | 'skip';

export interface UploadBatchLog {
  id: string;
  fileName: string;
  uploadTimestamp: string;
  dateRange: string;
  marketplacesDetected: MarketplaceId[];
  rowsProcessed: number;
  rowsInserted: number;
  rowsUpdated: number;
  rowsSkipped: number;
  duplicateCount: number;
  errorCount: number;
  processingTimeMs: number;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  errors?: string[];
}

export interface DuplicateConflict {
  dateKey: string;
  marketplaceId: MarketplaceId;
  existingCount: number;
  newCount: number;
  categoriesAffected: string[];
}

export interface MyntraStyleCount {
  category: string;
  count: number;
}

export interface DashboardMetrics {
  todaysSales: number;
  monthlySales: number;
  categoriesUpdated: number;
  filesUploaded: number;
  latestUploadTime: string;
  pendingCategoriesCount: number;
}

export interface AnalyticsTrendPoint {
  date: string;
  myntra: number;
  amazon: number;
  ajio: number;
  nykaa: number;
  firstcry: number;
  flipkart: number;
  d2c: number;
  total: number;
}

export interface DynoSyncStatus {
  isSyncing: boolean;
  lastSyncTime: string | null;
  syncedFilesCount: number;
  totalRecordsSynced: number;
  error: string | null;
}

