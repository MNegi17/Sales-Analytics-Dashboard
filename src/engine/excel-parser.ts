import * as XLSX from 'xlsx';
import { RawSaleRow, MarketplaceId } from '../types';
import { CHANNEL_TO_MARKETPLACE_MAP } from './constants';

export interface ParseResult {
  fileName: string;
  rows: RawSaleRow[];
  marketplacesDetected: MarketplaceId[];
  dateRange: string;
  minDate?: string;
  maxDate?: string;
  errors: string[];
  totalRawRows: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Short month name → 0-based index map
const SHORT_MONTH_MAP: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  january: 0, february: 1, march: 2, april: 3, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
};

/**
 * Flexible Channel Mapping Lookup
 */
function findChannelMapping(channelStr: string): { marketplaceId: MarketplaceId; subChannel?: string } | null {
  if (!channelStr) return null;
  const trimmed = channelStr.trim();
  const norm = trimmed.toUpperCase().replace(/[\s_\-]/g, '');

  // 1. Direct key match
  if (CHANNEL_TO_MARKETPLACE_MAP[trimmed]) return CHANNEL_TO_MARKETPLACE_MAP[trimmed];

  // 2. Normalized key match
  for (const [key, val] of Object.entries(CHANNEL_TO_MARKETPLACE_MAP)) {
    if (key.trim().toUpperCase().replace(/[\s_\-]/g, '') === norm) return val;
  }

  // 3. Keyword / partial matching fallback
  if (norm.includes('MYNTRA')) {
    if (norm.includes('SJIT')) return { marketplaceId: 'myntra', subChannel: 'SJIT' };
    return { marketplaceId: 'myntra', subChannel: 'PPMP' };
  }
  if (norm.includes('AMAZON') || norm.includes('COCOBLU')) {
    if (norm.includes('FBA')) return { marketplaceId: 'amazon', subChannel: 'FBA' };
    if (norm.includes('COCOBLU')) return { marketplaceId: 'amazon', subChannel: 'Cocoblu' };
    return { marketplaceId: 'amazon', subChannel: 'Amazon' };
  }
  if (norm.includes('AJIO')) return { marketplaceId: 'ajio' };
  if (norm.includes('NYKAA')) return { marketplaceId: 'nykaa' };
  if (norm.includes('FIRSTCRY') || norm.includes('FIRST')) return { marketplaceId: 'firstcry' };
  if (norm.includes('FLIPKART')) return { marketplaceId: 'flipkart' };
  if (norm.includes('D2C') || norm.includes('SHOPIFY')) return { marketplaceId: 'd2c' };

  return null;
}

/**
 * Robust Date Parser:
 * Handles:
 * 1. Excel Serial Numbers (e.g. 45809, 46175)
 * 2. "05 May" or "05-Jun-26" or "5 Jun 2026"
 * 3. "Jun 05, 2026" or "June 5, 2026"
 * 4. "YYYY-MM-DD"
 * 5. "DD/MM/YYYY" or "DD-MM-YYYY" or "MM/DD/YYYY"
 * 6. Native JS Date
 */
function parseSheetDate(rawDateVal: any, rawYearVal: any): Date | null {
  if (rawDateVal === null || rawDateVal === undefined || rawDateVal === '') return null;

  // ── Step 1: Excel Serial Number (e.g. 46175 or "46175") ──
  const isNum = typeof rawDateVal === 'number';
  const isNumStr = typeof rawDateVal === 'string' && /^\d{5}(\.\d+)?$/.test(rawDateVal.trim());
  if (isNum || isNumStr) {
    const serial = parseFloat(String(rawDateVal));
    if (serial > 20000 && serial < 60000) {
      const utcDays = Math.floor(serial - 25569);
      const utcValue = utcDays * 86400;
      const dateInfo = new Date(utcValue * 1000);
      let year = dateInfo.getUTCFullYear();
      if ((year < 2020 || year > 2035) && rawYearVal) {
        const py = parseInt(String(rawYearVal).trim(), 10);
        if (!isNaN(py) && py > 2000) year = py;
      }
      return new Date(year, dateInfo.getUTCMonth(), dateInfo.getUTCDate());
    }
  }

  // ── Step 2: JS Date instance ──
  if (rawDateVal instanceof Date && !isNaN(rawDateVal.getTime())) {
    let year = rawDateVal.getFullYear();
    if (year < 2000) year += 100;
    if ((year < 2020 || year > 2035) && rawYearVal) {
      const parsedYear = parseInt(String(rawYearVal).trim(), 10);
      if (!isNaN(parsedYear) && parsedYear > 2000) year = parsedYear;
    }
    return new Date(year, rawDateVal.getMonth(), rawDateVal.getDate());
  }

  const strDate = String(rawDateVal).trim();
  if (!strDate) return null;

  // ── Step 3: "dd mmm yy" or "dd mmm yyyy" or "dd-mmm-yy" (e.g. "05-Jun-26", "5 Jun 2026", "05 May") ──
  const ddMmmMatch = strDate.match(/^(\d{1,2})[\s\-\/]([A-Za-z]{3,})(?:[\s\-\/](\d{2,4}))?$/);
  if (ddMmmMatch) {
    const day = parseInt(ddMmmMatch[1], 10);
    const monthStr = ddMmmMatch[2].toLowerCase();
    const monthIdx = SHORT_MONTH_MAP[monthStr];

    if (monthIdx !== undefined && day >= 1 && day <= 31) {
      let year = 2026;
      if (ddMmmMatch[3]) {
        let parsedY = parseInt(ddMmmMatch[3], 10);
        if (parsedY < 100) parsedY += 2000;
        year = parsedY;
      } else if (rawYearVal) {
        const py = parseInt(String(rawYearVal).trim(), 10);
        if (!isNaN(py) && py > 2000) year = py;
      }
      return new Date(year, monthIdx, day);
    }
  }

  // ── Step 4: "mmm dd, yyyy" or "mmm dd yyyy" (e.g. "Jun 05, 2026") ──
  const mmmDdMatch = strDate.match(/^([A-Za-z]{3,})[\s\-\/](\d{1,2}),?(?:[\s\-\/](\d{2,4}))?$/);
  if (mmmDdMatch) {
    const monthStr = mmmDdMatch[1].toLowerCase();
    const monthIdx = SHORT_MONTH_MAP[monthStr];
    const day = parseInt(mmmDdMatch[2], 10);

    if (monthIdx !== undefined && day >= 1 && day <= 31) {
      let year = 2026;
      if (mmmDdMatch[3]) {
        let parsedY = parseInt(mmmDdMatch[3], 10);
        if (parsedY < 100) parsedY += 2000;
        year = parsedY;
      } else if (rawYearVal) {
        const py = parseInt(String(rawYearVal).trim(), 10);
        if (!isNaN(py) && py > 2000) year = py;
      }
      return new Date(year, monthIdx, day);
    }
  }

  // ── Step 5: YYYY-MM-DD ISO format ──
  if (strDate.match(/^\d{4}-\d{2}-\d{2}/)) {
    const d = new Date(strDate);
    if (!isNaN(d.getTime())) {
      let year = d.getFullYear();
      if ((year < 2020 || year > 2035) && rawYearVal) {
        const py = parseInt(String(rawYearVal).trim(), 10);
        if (!isNaN(py) && py > 2000) year = py;
      }
      return new Date(year, d.getMonth(), d.getDate());
    }
  }

  // ── Step 6: DD/MM/YYYY or DD-MM-YYYY or MM/DD/YYYY ──
  const dateTokens = strDate.split(/\s+/)[0].split(/[/\-\.]/);
  if (dateTokens.length >= 3) {
    let p1 = parseInt(dateTokens[0], 10);
    let p2 = parseInt(dateTokens[1], 10);
    let year = parseInt(dateTokens[2], 10);

    if (year < 100) year += 2000;

    // Handle DD/MM/YYYY vs MM/DD/YYYY
    let day = p1;
    let month = p2 - 1;
    if (p1 <= 12 && p2 > 12) {
      // MM/DD/YYYY
      day = p2;
      month = p1 - 1;
    }

    if (!isNaN(day) && !isNaN(month) && !isNaN(year) && month >= 0 && month < 12 && day >= 1 && day <= 31) {
      return new Date(year, month, day);
    }
  }

  return null;
}

/**
 * Case-insensitive & normalized property lookup
 */
function getRowValue(row: Record<string, any>, candidateKeys: string[]): any {
  for (const k of candidateKeys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
      return row[k];
    }
  }

  const rowKeys = Object.keys(row);
  for (const candidate of candidateKeys) {
    const normCandidate = candidate.toLowerCase().replace(/[\s_\-]/g, '');
    const foundKey = rowKeys.find(rk => rk.toLowerCase().replace(/[\s_\-]/g, '') === normCandidate);
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && String(row[foundKey]).trim() !== '') {
      return row[foundKey];
    }
  }

  return undefined;
}

export async function parseSalesExcelFile(file: File): Promise<ParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: false, raw: false });

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { raw: false });

  const parsedRows: RawSaleRow[] = [];
  const errors: string[] = [];
  const marketplaceSet = new Set<MarketplaceId>();
  const dateSet = new Set<string>();

  for (let idx = 0; idx < jsonRows.length; idx++) {
    const row = jsonRows[idx];

    // ── Channel Name ──
    const rawChannelName = getRowValue(row, [
      'Channel Name', 'channel_name', 'Channel', 'channel', 'Marketplace', 'Sales Channel', 'ChannelName'
    ]);

    const channelName = (rawChannelName || '').toString().trim();
    if (!channelName) {
      errors.push(`Row ${idx + 2}: Missing Channel Name`);
      continue;
    }

    const mapping = findChannelMapping(channelName);
    if (mapping) {
      marketplaceSet.add(mapping.marketplaceId);
    } else {
      errors.push(`Row ${idx + 2}: Unknown Channel Name "${channelName}"`);
    }

    // ── Category & Division ──
    const rawCategory = getRowValue(row, [
      'Category', 'category', 'Product Category', 'Item Category', 'Category Name'
    ]);
    const rawDivision = getRowValue(row, [
      'Division', 'division', 'Department', 'Gender'
    ]);
    const rawNew = getRowValue(row, [
      'New', 'new', 'Is New', 'IsNew', 'New Style', 'Contribution'
    ]);

    const category = (rawCategory || '').toString().trim().toUpperCase();
    const division = (rawDivision || '').toString().trim().toUpperCase();
    const isNew = !!(rawNew && String(rawNew).trim().length > 0 && String(rawNew).trim().toUpperCase() !== 'FALSE' && String(rawNew).trim() !== '0');

    if (!category) {
      errors.push(`Row ${idx + 2}: Missing Category`);
      continue;
    }

    // ── Date: check "Date", "Order Date", etc. ──
    const rawDateVal = getRowValue(row, [
      'Date', 'date', 'Order Date', 'order_date', 'Order Date as dd/mm/yyyy hh:MM:ss',
      'Shipping Package Creation Date', 'Sale Date', 'Created At', 'OrderDate', 'Transaction Date'
    ]);

    const rawYearVal = getRowValue(row, ['Year', 'year']);

    const dateObj = parseSheetDate(rawDateVal, rawYearVal);

    if (!dateObj || isNaN(dateObj.getTime())) {
      errors.push(`Row ${idx + 2}: Cannot parse date from Date="${rawDateVal}", Year="${rawYearVal}"`);
      continue;
    }

    const year = dateObj.getFullYear();
    const monthIdx = dateObj.getMonth();
    const monthName = MONTH_NAMES[monthIdx];
    const day = dateObj.getDate();

    const formattedMonth = String(monthIdx + 1).padStart(2, '0');
    const formattedDay   = String(day).padStart(2, '0');
    const formattedDate  = `${year}-${formattedMonth}-${formattedDay}`;
    const monthYearKey   = `${monthName} ${year}`;

    dateSet.add(formattedDate);

    parsedRows.push({
      skuCode:       (getRowValue(row, ['Item SKU Code', 'Seller SKU Code', 'SKU']) || '').toString(),
      division:      division || 'APPAREL',
      category,
      subcategory:   (getRowValue(row, ['Subcategory', 'subcategory']) || '').toString(),
      isNew,
      channelName,
      orderDate:     dateObj,
      formattedDate,
      dayOfMonth:    day,
      monthName,
      monthYearKey,
      year,
      saleOrderCode: (getRowValue(row, ['Sale Order Code', 'Order ID']) || '').toString(),
      price:         parseFloat(getRowValue(row, ['New SP', 'Cost Price', 'Price']) || '0') || 0
    });
  }

  const sortedDates = Array.from(dateSet).sort();
  const minDate = sortedDates[0] || 'N/A';
  const maxDate = sortedDates[sortedDates.length - 1] || 'N/A';
  const dateRange = minDate === maxDate ? minDate : `${minDate} to ${maxDate}`;

  return {
    fileName: file.name,
    rows: parsedRows,
    marketplacesDetected: Array.from(marketplaceSet),
    dateRange,
    minDate,
    maxDate,
    errors,
    totalRawRows: jsonRows.length
  };
}
