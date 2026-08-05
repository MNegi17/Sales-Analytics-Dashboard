import { RawSaleRow, MarketplaceId } from '../types';
import { CHANNEL_TO_MARKETPLACE_MAP, ALL_CATEGORIES } from './constants';

export interface ValidationSummary {
  isValid: boolean;
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  unknownMarketplaceCount: number;
  unknownCategoryCount: number;
  missingDateCount: number;
  duplicateRowsCount: number;
  errors: string[];
  warnings: string[];
}

export function validateSalesData(rows: RawSaleRow[]): ValidationSummary {
  const validCategoriesSet = new Set(ALL_CATEGORIES.map(c => c.name));
  
  let validRowsCount = 0;
  let invalidRowsCount = 0;
  let unknownMarketplaceCount = 0;
  let unknownCategoryCount = 0;
  let missingDateCount = 0;
  let duplicateRowsCount = 0;

  const errors: string[] = [];
  const warnings: string[] = [];
  const rowFingerprints = new Set<string>();

  rows.forEach((row, idx) => {
    let rowValid = true;

    // Check Channel / Marketplace
    const channelMapping = CHANNEL_TO_MARKETPLACE_MAP[row.channelName];
    if (!channelMapping) {
      unknownMarketplaceCount++;
      errors.push(`Row ${idx + 1}: Unrecognized channel "${row.channelName}"`);
      rowValid = false;
    }

    // Check Category
    if (!row.category) {
      unknownCategoryCount++;
      errors.push(`Row ${idx + 1}: Blank category`);
      rowValid = false;
    } else if (!validCategoriesSet.has(row.category)) {
      unknownCategoryCount++;
      warnings.push(`Row ${idx + 1}: Unregistered category "${row.category}" (Will still process under standard list)`);
    }

    // Check Date
    if (!row.formattedDate || !row.monthYearKey) {
      missingDateCount++;
      errors.push(`Row ${idx + 1}: Missing or invalid date`);
      rowValid = false;
    }

    // Check Fingerprint (duplicate line item detection)
    const fingerprint = `${row.formattedDate}_${row.channelName}_${row.skuCode}_${row.saleOrderCode}_${idx}`;
    if (rowFingerprints.has(fingerprint)) {
      duplicateRowsCount++;
    } else {
      rowFingerprints.add(fingerprint);
    }

    if (rowValid) {
      validRowsCount++;
    } else {
      invalidRowsCount++;
    }
  });

  return {
    isValid: invalidRowsCount === 0,
    totalRows: rows.length,
    validRowsCount,
    invalidRowsCount,
    unknownMarketplaceCount,
    unknownCategoryCount,
    missingDateCount,
    duplicateRowsCount,
    errors,
    warnings
  };
}
