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
  // allow full names too
  january: 0, february: 1, march: 2, april: 3, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
};

/**
 * PRIMARY date parser:
 * Handles the file's specific format: Date column = "dd mmm" (e.g. "05 May", "13 Aug")
 * Year column = "2026" (separate numeric column)
 *
 * Also handles fallback patterns as needed.
 */
function parseSheetDate(rawDateVal: any, rawYearVal: any): Date | null {

  // ── Step 1: Try "dd mmm" + Year column (PRIMARY – the actual file format) ──
  if (rawDateVal) {
    const strDate = String(rawDateVal).trim();

    // Pattern: "05 May" or "5 May" or "05-May" or "5-May" (day + 3-letter month)
    const ddMmmMatch = strDate.match(/^(\d{1,2})[\s\-\/]([A-Za-z]{3,})$/);
    if (ddMmmMatch) {
      const day = parseInt(ddMmmMatch[1], 10);
      const monthStr = ddMmmMatch[2].toLowerCase();
      const monthIdx = SHORT_MONTH_MAP[monthStr];

      if (monthIdx !== undefined && day >= 1 && day <= 31) {
        // Use Year column for year
        let year = 2026; // sensible default
        if (rawYearVal !== null && rawYearVal !== undefined) {
          const parsedYear = parseInt(String(rawYearVal).trim(), 10);
          if (!isNaN(parsedYear) && parsedYear > 2000) {
            year = parsedYear;
          }
        }
        return new Date(year, monthIdx, day);
      }
    }

    // Pattern: "05 May 2026" or "5 May 2026" (dd mmm yyyy – year embedded)
    const ddMmmYyyyMatch = strDate.match(/^(\d{1,2})[\s\-\/]([A-Za-z]{3,})[\s\-\/](\d{4})$/);
    if (ddMmmYyyyMatch) {
      const day = parseInt(ddMmmYyyyMatch[1], 10);
      const monthStr = ddMmmYyyyMatch[2].toLowerCase();
      const monthIdx = SHORT_MONTH_MAP[monthStr];
      const year = parseInt(ddMmmYyyyMatch[3], 10);
      if (monthIdx !== undefined && day >= 1 && day <= 31 && year > 2000) {
        return new Date(year, monthIdx, day);
      }
    }
  }

  // ── Step 2: Already a JS Date (XLSX parsed it as a date type) ──
  if (rawDateVal instanceof Date && !isNaN(rawDateVal.getTime())) {
    let year = rawDateVal.getFullYear();
    // Fix XLSX serial date 2-digit year issue
    if (year < 2000) year += 100;

    // If year looks wrong (defaulted to 1899/1900), use Year column
    if ((year < 2020 || year > 2035) && rawYearVal) {
      const parsedYear = parseInt(String(rawYearVal).trim(), 10);
      if (!isNaN(parsedYear) && parsedYear > 2000) {
        year = parsedYear;
      }
    }
    return new Date(year, rawDateVal.getMonth(), rawDateVal.getDate());
  }

  if (!rawDateVal) return null;
  const strVal = String(rawDateVal).trim();
  if (!strVal) return null;

  // ── Step 3: YYYY-MM-DD ISO format ──
  if (strVal.match(/^\d{4}-\d{2}-\d{2}/)) {
    const d = new Date(strVal);
    if (!isNaN(d.getTime())) {
      let year = d.getFullYear();
      if ((year < 2020 || year > 2035) && rawYearVal) {
        const py = parseInt(String(rawYearVal).trim(), 10);
        if (!isNaN(py) && py > 2000) year = py;
      }
      return new Date(year, d.getMonth(), d.getDate());
    }
  }

  // ── Step 4: DD/MM/YYYY or DD-MM-YYYY ──
  const dateTokens = strVal.split(/\s+/)[0].split(/[/\-\.]/);
  if (dateTokens.length >= 3) {
    const day = parseInt(dateTokens[0], 10);
    const month = parseInt(dateTokens[1], 10) - 1;
    let year = parseInt(dateTokens[2], 10);

    if (year < 100) {
      const py = rawYearVal ? parseInt(String(rawYearVal).trim(), 10) : NaN;
      year = !isNaN(py) && py > 2000 ? py : 2000 + year;
    }

    if (!isNaN(day) && !isNaN(month) && !isNaN(year) && month >= 0 && month < 12 && day >= 1 && day <= 31) {
      return new Date(year, month, day);
    }
  }

  return null;
}

export async function parseSalesExcelFile(file: File): Promise<ParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  // Use raw:true to avoid XLSX auto-converting "05 May" into a JS Date incorrectly
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: false, raw: false });

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // sheet_to_json with raw:false gives us string representations of cells
  const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { raw: false });

  const parsedRows: RawSaleRow[] = [];
  const errors: string[] = [];
  const marketplaceSet = new Set<MarketplaceId>();
  const dateSet = new Set<string>();

  for (let idx = 0; idx < jsonRows.length; idx++) {
    const row = jsonRows[idx];

    // ── Channel Name ──
    const channelName = (row['Channel Name'] || '').toString().trim();
    if (!channelName) {
      errors.push(`Row ${idx + 2}: Missing Channel Name`);
      continue;
    }

    const mapping = CHANNEL_TO_MARKETPLACE_MAP[channelName];
    if (mapping) {
      marketplaceSet.add(mapping.marketplaceId);
    } else {
      errors.push(`Row ${idx + 2}: Unknown Channel Name "${channelName}"`);
    }

    // ── Category & Division ──
    const category = (row['Category'] || '').toString().trim().toUpperCase();
    const division = (row['Division'] || '').toString().trim().toUpperCase();
    const isNew = !!(row['New'] && row['New'].toString().trim().length > 0);

    if (!category) {
      errors.push(`Row ${idx + 2}: Missing Category`);
      continue;
    }

    // ── Date: use "Date" column (dd mmm) + "Year" column ──
    // Try the explicit columns the user described first, then fallbacks
    const rawDateVal =
      row['Date'] ||                                          // PRIMARY: "dd mmm" column
      row['Order Date as dd/mm/yyyy hh:MM:ss'] ||            // fallback
      row['Shipping Package Creation Date'] ||               // fallback
      row['Order Date'];                                     // fallback

    const rawYearVal = row['Year'];                          // Separate year column

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
      skuCode:       (row['Item SKU Code'] || row['Seller SKU Code'] || '').toString(),
      division:      division || 'APPAREL',
      category,
      subcategory:   (row['Subcategory'] || '').toString(),
      isNew,
      channelName,
      orderDate:     dateObj,
      formattedDate,
      dayOfMonth:    day,
      monthName,
      monthYearKey,
      year,
      saleOrderCode: (row['Sale Order Code'] || '').toString(),
      price:         parseFloat(row['New SP'] || row['Cost Price'] || '0') || 0
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
