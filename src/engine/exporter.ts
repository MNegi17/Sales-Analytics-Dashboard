import ExcelJS from 'exceljs';
import { DailyCategoryStat, MarketplaceId, MyntraStyleCount } from '../types';
import { MARKETPLACE_CONFIGS, FOOTWEAR_CATEGORIES, APPAREL_CATEGORIES } from './constants';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'June',
  'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'
];

interface ParsedExportMY {
  year: number;
  monthIdx: number;
  monthName: string;
  shortMonth: string;
  monthNumberStr: string;
  daysInMonth: number;
}

function parseExportMonthYear(monthYearKey: string): ParsedExportMY {
  const parts = monthYearKey.trim().split(/\s+/);
  const mName = parts[0] || 'September';
  const year = parseInt(parts[1], 10) || 2026;

  let mIdx = MONTH_NAMES.findIndex(m => m.toLowerCase() === mName.toLowerCase());
  if (mIdx === -1) {
    mIdx = SHORT_MONTH_NAMES.findIndex(m => m.toLowerCase() === mName.toLowerCase());
  }
  if (mIdx === -1) mIdx = 8; // September

  const daysInMonth = new Date(year, mIdx + 1, 0).getDate();
  const monthNumberStr = String(mIdx + 1).padStart(2, '0');

  return {
    year,
    monthIdx: mIdx,
    monthName: MONTH_NAMES[mIdx],
    shortMonth: SHORT_MONTH_NAMES[mIdx],
    monthNumberStr,
    daysInMonth
  };
}

export async function generateMonthlyExcelWorkbook(
  marketplaceId: MarketplaceId,
  monthYearKey: string, // e.g. "September 2026"
  monthlyStats: DailyCategoryStat[],
  myntraStyleCounts: Record<string, number> = {}
): Promise<ArrayBuffer> {
  const config = MARKETPLACE_CONFIGS[marketplaceId];
  const workbook = new ExcelJS.Workbook();
  const sheetName = monthYearKey.split(' ')[0] || 'Monthly Sales';
  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true }]
  });

  const parsedMY = parseExportMonthYear(monthYearKey);

  // Generate full range of days in the month (e.g. 1..30 for Sept, 1..31 for Aug)
  const daysInMonth = Array.from({ length: parsedMY.daysInMonth }, (_, i) => i + 1);

  if (config.structure === 'STRUCTURE_A' && marketplaceId === 'myntra') {
    generateMyntraStructureA(worksheet, daysInMonth, monthlyStats, myntraStyleCounts, parsedMY);
  } else if (config.structure === 'STRUCTURE_A' && marketplaceId === 'amazon') {
    generateAmazonStructureA(worksheet, daysInMonth, monthlyStats, parsedMY);
  } else {
    generateStructureB(worksheet, daysInMonth, monthlyStats, config.name, parsedMY);
  }

  return await workbook.xlsx.writeBuffer();
}

/** Helper: Get day of week name (Saturday, Sunday, Monday...) */
function getDayOfWeekName(day: number, year: number, monthIdx: number): string {
  const d = new Date(year, monthIdx, day);
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

// ============================================================================
// 1. MYNTRA STRUCTURE A GENERATOR
// ============================================================================
function generateMyntraStructureA(
  ws: ExcelJS.Worksheet,
  days: number[],
  stats: DailyCategoryStat[],
  styleCounts: Record<string, number>,
  parsedMY: ParsedExportMY
) {
  // Styles
  const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } }; // Light green
  const subHeaderFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }; // Soft grey
  const totalFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } }; // Soft yellow
  const fontBold = { name: 'Calibri', size: 10, bold: true };
  const fontNormal = { name: 'Calibri', size: 10 };
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
  };

  // Construct Row 1 & Row 2
  const r1: (string | null)[] = ['Category Level', null, null, 'Size Ratio Percentage', null, null];
  const r2: string[] = ['Category', 'Online Style Count', 'Division', 'Larger Size %', 'Smaller Size %'];

  // Add 3 columns for each day: PPMP, SJIT, Date Total
  const dayColIndices: { day: number; ppmpCol: number; sjitCol: number; totalCol: number }[] = [];
  let curCol = 6;

  days.forEach(day => {
    const dow = getDayOfWeekName(day, parsedMY.year, parsedMY.monthIdx);
    r1.push(dow, null, null);
    
    const dayStr = String(day).padStart(2, '0');
    r2.push(`${dayStr}-${parsedMY.monthNumberStr}-${parsedMY.year} PPMP`, `${dayStr}-${parsedMY.monthNumberStr}-${parsedMY.year} SJIT`, `${dayStr} ${parsedMY.shortMonth}.`);
    
    dayColIndices.push({
      day,
      ppmpCol: curCol,
      sjitCol: curCol + 1,
      totalCol: curCol + 2
    });
    curCol += 3;
  });

  r1.push('Grand Total', null, null, null, null, null, null);
  r2.push('Grand Total', 'Share %', 'Target Unit', 'Achievement %', 'New Style', 'New Cont.', 'New Style Listed');

  ws.addRow(r1);
  ws.addRow(r2);

  // Apply Row 1 & 2 styles
  const row1 = ws.getRow(1);
  const row2 = ws.getRow(2);
  row1.font = fontBold;
  row2.font = fontBold;

  row1.eachCell(cell => { cell.fill = headerFill; cell.border = thinBorder; });
  row2.eachCell(cell => { cell.fill = subHeaderFill; cell.border = thinBorder; });

  // Map category data lookup: category -> day -> subChannel -> totalUnits
  const dataLookup = new Map<string, Map<number, { ppmp: number; sjit: number; ppmpNew: number; sjitNew: number }>>();

  stats.forEach(s => {
    if (s.marketplaceId !== 'myntra') return;
    if (!dataLookup.has(s.category)) dataLookup.set(s.category, new Map());
    const dayMap = dataLookup.get(s.category)!;
    if (!dayMap.has(s.day)) dayMap.set(s.day, { ppmp: 0, sjit: 0, ppmpNew: 0, sjitNew: 0 });
    
    const dRec = dayMap.get(s.day)!;
    if (s.subChannel === 'PPMP' || s.channelName.includes('MYNTRA_ONLINE')) {
      dRec.ppmp += s.totalUnits;
      dRec.ppmpNew += s.newStyleUnits;
    } else {
      dRec.sjit += s.totalUnits;
      dRec.sjitNew += s.newStyleUnits;
    }
  });

  const categories = [...FOOTWEAR_CATEGORIES, ...APPAREL_CATEGORIES];
  const mainCategoryRowStart = 3;

  categories.forEach((catDef, idx) => {
    const rowNum = mainCategoryRowStart + idx;
    const catName = catDef.name;
    const styleCount = styleCounts[catName] ?? catDef.defaultMyntraStyleCount ?? 0;
    
    const rowVals: (string | number | null)[] = [
      catName,
      styleCount,
      catDef.division,
      catDef.largerSizePct || 0,
      catDef.smallerSizePct || 0
    ];

    dayColIndices.forEach(dc => {
      const dRec = dataLookup.get(catName)?.get(dc.day);
      const ppmpVal = dRec?.ppmp || 0;
      const sjitVal = dRec?.sjit || 0;
      rowVals.push(ppmpVal || null, sjitVal || null, null); // total cell formula added next
    });

    const addedRow = ws.addRow(rowVals);
    addedRow.font = fontNormal;
    addedRow.eachCell(cell => { cell.border = thinBorder; });

    // Formulas for Date Total per row
    dayColIndices.forEach(dc => {
      const ppmpColLetter = getColLetter(dc.ppmpCol);
      const sjitColLetter = getColLetter(dc.sjitCol);
      const totCell = addedRow.getCell(dc.totalCol);
      totCell.value = { formula: `=${ppmpColLetter}${rowNum}+${sjitColLetter}${rowNum}` };
    });

    // Grand Total formula
    const totalColsLetters = dayColIndices.map(dc => `${getColLetter(dc.totalCol)}${rowNum}`).join('+');
    const grandTotalColIdx = 6 + days.length * 3;
    addedRow.getCell(grandTotalColIdx).value = { formula: `=${totalColsLetters}` };
    
    // Share % formula
    const grandTotalLetter = getColLetter(grandTotalColIdx);
    const grandTotalRow = mainCategoryRowStart + categories.length; // Row 35
    addedRow.getCell(grandTotalColIdx + 1).value = { formula: `=${grandTotalLetter}${rowNum}/$${grandTotalLetter}$${grandTotalRow}` };
  });

  // Main Grand Total Row (Row 35)
  const grandTotalRowIdx = mainCategoryRowStart + categories.length;
  const gtVals: (string | null)[] = ['Grand Total', null, null, null, null];
  
  dayColIndices.forEach(dc => {
    const ppmpL = getColLetter(dc.ppmpCol);
    const sjitL = getColLetter(dc.sjitCol);
    const totL = getColLetter(dc.totalCol);
    const lastCatRow = grandTotalRowIdx - 1;
    
    gtVals.push(null, null, null); // Will put formulas
  });

  const gtRow = ws.addRow(gtVals);
  gtRow.font = fontBold;
  gtRow.eachCell(cell => { cell.fill = totalFill; cell.border = thinBorder; });

  dayColIndices.forEach(dc => {
    const ppmpL = getColLetter(dc.ppmpCol);
    const sjitL = getColLetter(dc.sjitCol);
    const totL = getColLetter(dc.totalCol);
    const lastCatRow = grandTotalRowIdx - 1;

    gtRow.getCell(dc.ppmpCol).value = { formula: `=SUM(${ppmpL}3:${ppmpL}${lastCatRow})` };
    gtRow.getCell(dc.sjitCol).value = { formula: `=SUM(${sjitL}3:${sjitL}${lastCatRow})` };
    gtRow.getCell(dc.totalCol).value = { formula: `=SUM(${totL}3:${totL}${lastCatRow})` };
  });

  // Set column widths
  ws.getColumn(1).width = 22;
  ws.getColumn(2).width = 18;
  ws.getColumn(3).width = 14;
}

// ============================================================================
// 2. AMAZON STRUCTURE A GENERATOR
// ============================================================================
function generateAmazonStructureA(
  ws: ExcelJS.Worksheet,
  days: number[],
  stats: DailyCategoryStat[],
  parsedMY: ParsedExportMY
) {
  const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE699' } }; // Light orange/yellow
  const fontBold = { name: 'Calibri', size: 10, bold: true };
  const fontNormal = { name: 'Calibri', size: 10 };
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
  };

  const r1: (string | null)[] = ['Category Level', null, null, null, null];
  const r2: string[] = ['Category', 'Division', 'Amazon', 'Cocoblu', 'FBA'];

  const dayColIndices: { day: number; amzCol: number; cocoCol: number; fbaCol: number; totalCol: number }[] = [];
  let curCol = 6;

  days.forEach(day => {
    const dow = getDayOfWeekName(day, parsedMY.year, parsedMY.monthIdx);
    r1.push(dow, null, null, null);
    
    r2.push(`${day} ${parsedMY.shortMonth}.`, 'Amazon', 'Cocoblu', 'FBA');
    dayColIndices.push({
      day,
      amzCol: curCol,
      cocoCol: curCol + 1,
      fbaCol: curCol + 2,
      totalCol: curCol // First subcol
    });
    curCol += 4;
  });

  r1.push('Grand Total', 'Share %');
  r2.push('Grand Total', 'Share %');

  ws.addRow(r1);
  ws.addRow(r2);

  ws.getRow(1).font = fontBold;
  ws.getRow(2).font = fontBold;
  ws.getRow(1).eachCell(cell => { cell.fill = headerFill; cell.border = thinBorder; });
  ws.getRow(2).eachCell(cell => { cell.fill = headerFill; cell.border = thinBorder; });

  // Map category data: category -> day -> subChannel -> count
  const dataLookup = new Map<string, Map<number, { amz: number; coco: number; fba: number }>>();

  stats.forEach(s => {
    if (s.marketplaceId !== 'amazon') return;
    if (!dataLookup.has(s.category)) dataLookup.set(s.category, new Map());
    const dayMap = dataLookup.get(s.category)!;
    if (!dayMap.has(s.day)) dayMap.set(s.day, { amz: 0, coco: 0, fba: 0 });
    
    const dRec = dayMap.get(s.day)!;
    if (s.subChannel === 'FBA' || s.channelName.includes('FBA')) {
      dRec.fba += s.totalUnits;
    } else if (s.subChannel === 'Cocoblu' || s.channelName.includes('COCOBLU')) {
      dRec.coco += s.totalUnits;
    } else {
      dRec.amz += s.totalUnits;
    }
  });

  const categories = [...FOOTWEAR_CATEGORIES, ...APPAREL_CATEGORIES];

  categories.forEach((catDef, idx) => {
    const rowNum = 3 + idx;
    const catName = catDef.name;
    const rowVals: (string | number | null)[] = [
      catName,
      catDef.division,
      null, null, null // Initial Amazon/Cocoblu/FBA summary cols
    ];

    days.forEach(day => {
      const dRec = dataLookup.get(catName)?.get(day);
      rowVals.push(dRec?.amz || null, dRec?.coco || null, dRec?.fba || null, null);
    });

    const addedRow = ws.addRow(rowVals);
    addedRow.font = fontNormal;
    addedRow.eachCell(cell => { cell.border = thinBorder; });
  });

  ws.getColumn(1).width = 22;
  ws.getColumn(2).width = 14;
}

// ============================================================================
// 3. STRUCTURE B GENERATOR (Ajio, Nykaa, FirstCry, Flipkart, D2C)
// ============================================================================
function generateStructureB(
  ws: ExcelJS.Worksheet,
  days: number[],
  stats: DailyCategoryStat[],
  marketplaceName: string,
  parsedMY: ParsedExportMY
) {
  const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }; // Soft blue header
  const fontBold = { name: 'Calibri', size: 10, bold: true };
  const fontNormal = { name: 'Calibri', size: 10 };
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
  };

  const r1: (string | null)[] = ['Category Level', null, 'Size Ratio Percentage', null];
  const r2: string[] = ['Category', 'Division', 'Larger Size %', 'Smaller Size %'];

  const dayColMap = new Map<number, number>(); // day -> column index
  let curCol = 5;

  days.forEach(day => {
    const dow = getDayOfWeekName(day, parsedMY.year, parsedMY.monthIdx);
    r1.push(dow);
    r2.push(`${day} ${parsedMY.shortMonth}.`);
    dayColMap.set(day, curCol);
    curCol++;
  });

  r1.push('Grand Total', 'Share %', 'New Style', 'New Cont.', 'New Style Listed', 'Sales on New Styles', 'New Styles In Process');
  r2.push('Grand Total', 'Share %', 'New Style', 'New Cont.', 'New Style Listed', 'Sales on New Styles', 'New Styles In Process');

  ws.addRow(r1);
  ws.addRow(r2);

  ws.getRow(1).font = fontBold;
  ws.getRow(2).font = fontBold;
  ws.getRow(1).eachCell(cell => { cell.fill = headerFill; cell.border = thinBorder; });
  ws.getRow(2).eachCell(cell => { cell.fill = headerFill; cell.border = thinBorder; });

  // Map data: category -> day -> { totalUnits, newStyleUnits }
  const dataLookup = new Map<string, Map<number, { total: number; newUnits: number }>>();

  stats.forEach(s => {
    if (!dataLookup.has(s.category)) dataLookup.set(s.category, new Map());
    const dayMap = dataLookup.get(s.category)!;
    if (!dayMap.has(s.day)) dayMap.set(s.day, { total: 0, newUnits: 0 });
    
    const dRec = dayMap.get(s.day)!;
    dRec.total += s.totalUnits;
    dRec.newUnits += s.newStyleUnits;
  });

  const categories = [...FOOTWEAR_CATEGORIES, ...APPAREL_CATEGORIES];
  const mainCategoryRowStart = 3;

  categories.forEach((catDef, idx) => {
    const rowNum = mainCategoryRowStart + idx;
    const catName = catDef.name;
    const rowVals: (string | number | null)[] = [
      catName,
      catDef.division,
      catDef.largerSizePct || 0,
      catDef.smallerSizePct || 0
    ];

    days.forEach(day => {
      const dRec = dataLookup.get(catName)?.get(day);
      rowVals.push(dRec?.total || null);
    });

    const addedRow = ws.addRow(rowVals);
    addedRow.font = fontNormal;
    addedRow.eachCell(cell => { cell.border = thinBorder; });

    // Grand Total formula for row
    const startDayCol = getColLetter(5);
    const endDayCol = getColLetter(4 + days.length);
    const grandTotalColIdx = 5 + days.length;
    addedRow.getCell(grandTotalColIdx).value = { formula: `=SUM(${startDayCol}${rowNum}:${endDayCol}${rowNum})` };

    // Share % formula
    const grandTotalRow = mainCategoryRowStart + categories.length; // Row 36
    const gtColLetter = getColLetter(grandTotalColIdx);
    addedRow.getCell(grandTotalColIdx + 1).value = { formula: `=${gtColLetter}${rowNum}/$${gtColLetter}$${grandTotalRow}` };
  });

  // Grand Total Row
  const lastCatRow = mainCategoryRowStart + categories.length - 1;
  const gtRowIdx = lastCatRow + 1;
  const gtVals: (string | null)[] = ['Grand Total', null, null, null];
  
  days.forEach(() => gtVals.push(null));
  const gtRow = ws.addRow(gtVals);
  gtRow.font = fontBold;
  gtRow.eachCell(cell => { cell.fill = headerFill; cell.border = thinBorder; });

  days.forEach((day, i) => {
    const colLetter = getColLetter(5 + i);
    gtRow.getCell(5 + i).value = { formula: `=SUM(${colLetter}3:${colLetter}${lastCatRow})` };
  });

  ws.getColumn(1).width = 22;
  ws.getColumn(2).width = 14;
}

/** Convert 1-indexed column number to Excel column letters (A, B, C... Z, AA, AB...) */
function getColLetter(colIdx: number): string {
  let temp: number;
  let letter = '';
  while (colIdx > 0) {
    temp = (colIdx - 1) % 26;
    letter = String.fromCharCode(65 + temp) + letter;
    colIdx = (colIdx - temp - 1) / 26;
  }
  return letter;
}
