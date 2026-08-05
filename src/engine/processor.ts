import { RawSaleRow, DailyCategoryStat, MarketplaceId } from '../types';
import { CHANNEL_TO_MARKETPLACE_MAP, ALL_CATEGORIES } from './constants';

export function aggregateSalesData(rows: RawSaleRow[]): DailyCategoryStat[] {
  const statMap = new Map<string, DailyCategoryStat>();
  const categoryDivisionLookup = new Map<string, string>();
  ALL_CATEGORIES.forEach(c => categoryDivisionLookup.set(c.name, c.division));

  for (const row of rows) {
    const mapping = CHANNEL_TO_MARKETPLACE_MAP[row.channelName];
    if (!mapping) continue; // Skip unknown channels if any

    const marketplaceId: MarketplaceId = mapping.marketplaceId;
    const subChannel = mapping.subChannel;
    const dateKey = row.formattedDate; // YYYY-MM-DD
    const category = row.category;
    const division = row.division || categoryDivisionLookup.get(category) || 'APPAREL';
    const isNew = row.isNew;

    // Key composite for aggregation
    // For Myntra and Amazon, we aggregate by subChannel as well!
    const key = `${marketplaceId}_${subChannel || 'MAIN'}_${dateKey}_${category}`;

    if (!statMap.has(key)) {
      statMap.set(key, {
        marketplaceId,
        channelName: row.channelName,
        subChannel,
        dateKey,
        monthYearKey: row.monthYearKey,
        year: row.year,
        month: row.monthName,
        day: row.dayOfMonth,
        category,
        division,
        totalUnits: 0,
        newStyleUnits: 0
      });
    }

    const stat = statMap.get(key)!;
    stat.totalUnits += 1;
    if (isNew) {
      stat.newStyleUnits += 1;
    }
  }

  return Array.from(statMap.values());
}
