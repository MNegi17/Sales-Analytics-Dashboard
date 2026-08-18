/**
 * Dyno Dashboard Supabase Data Connector & Real-Time Sync Engine
 * 
 * Securely connects to Dyno Dashboard's Supabase database (read-only consumer)
 * to fetch uploaded sales files and live Uniware sync batches,
 * normalizing and aggregating them into the Sales Analytics Excel spreadsheet state.
 */

const SUPABASE_URL = "https://vvruwxrhwppozvrprcix.supabase.co";
const SUPABASE_KEY = "sb_publishable_wEN47XUvThFsrpIZcPX35A_xkPbdJQ1";
const ADMIN_EMAIL = "manannegi17@gmail.com";
const ADMIN_PASSWORD = "Manan@dyno@17";

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTH_MAP = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
};

// Channel mapping for Dyno datasets
function mapDynoChannel(rawChannel) {
  if (!rawChannel) return null;
  const upper = String(rawChannel).trim().toUpperCase().replace(/[\s_\-]/g, '');

  if (upper.includes('MYNTRASJIT') || upper.includes('MYNTASJIT') || upper.includes('SJIT')) {
    return { marketplaceId: 'myntra', subChannel: 'SJIT' };
  }
  if (upper.includes('MYNTRA') || upper.includes('MYNTA')) {
    return { marketplaceId: 'myntra', subChannel: 'PPMP' };
  }
  if (upper.includes('COCOBLU')) {
    return { marketplaceId: 'amazon', subChannel: 'Cocoblu' };
  }
  if (upper.includes('FBA')) {
    return { marketplaceId: 'amazon', subChannel: 'FBA' };
  }
  if (upper.includes('AMAZON')) {
    return { marketplaceId: 'amazon', subChannel: 'Amazon' };
  }
  if (upper.includes('AJIO')) {
    return { marketplaceId: 'ajio', subChannel: 'Ajio' };
  }
  if (upper.includes('NYKAA')) {
    return { marketplaceId: 'nykaa', subChannel: 'Nykaa' };
  }
  if (upper.includes('FIRSTCRY') || upper.includes('FIRST')) {
    return { marketplaceId: 'firstcry', subChannel: 'FirstCry' };
  }
  if (upper.includes('FLIPKART')) {
    return { marketplaceId: 'flipkart', subChannel: 'Flipkart' };
  }
  if (upper.includes('D2C') || upper.includes('SHOPIFY') || upper.includes('MAGENTO') || upper.includes('PUSPL')) {
    return { marketplaceId: 'd2c', subChannel: 'D2C' };
  }

  return null;
}

const CATEGORY_ALIASES = {
  'SHIRT H/S': 'SHIRT',
  'SHIRT F/S': 'SHIRT',
  'SHIRTS': 'SHIRT',
  'POLO': 'POLO T-SHIRT',
  'POLO T SHIRT': 'POLO T-SHIRT',
  'POLO T-SHIRTS': 'POLO T-SHIRT',
  'TSHIRT': 'T-SHIRT',
  'T SHIRT': 'T-SHIRT',
  'T-SHIRTS': 'T-SHIRT',
  'BALLERINA': 'BALLERINAS',
  'BOOT': 'BOOTS',
  'FASHION SANDAL': 'FASHION SANDALS',
  'SANDAL': 'FASHION SANDALS',
  'SANDALS': 'FASHION SANDALS',
  'SLIDE': 'SLIDES',
  'FLIP FLOP': 'FLIP FLOPS',
  'FLIP-FLOPS': 'FLIP FLOPS',
  'FLIPFLOP': 'FLIP FLOPS',
  'FLIPFLOPS': 'FLIP FLOPS',
  'JEAN': 'JEANS',
  'JEGGINGS': 'JEGGING',
  'LOWERS': 'LOWER',
  'SKIRTS': 'SKIRT',
  'SWEATERS': 'SWEATER',
  'SWEATSHIRTS': 'SWEATSHIRT',
  'TOPS': 'TOP',
  'TROUSER': 'TROUSERS',
  'BERMUDAS': 'BERMUDA',
  'ROMPERS': 'ROMPER',
  'CAPS': 'CAP',
  'TOYS': 'TOY',
  'SHORT': 'SHORTS',
  'SETS': 'CLOTHING SET',
  'SET': 'CLOTHING SET',
  'SUIT SET': 'CLOTHING SET',
  'DUNGAREES': 'DUNGAREE',
  'JUMPSUITS': 'JUMPSUIT',
  'CANVAS': 'CANVAS SHOES',
  'CASUAL': 'CASUAL SHOES',
  'CASUAL SHOE': 'CASUAL SHOES',
  'SPORTS': 'SPORTS SHOES',
  'SPORTS SHOE': 'SPORTS SHOES',
  'SPORTS SANDAL': 'SPORTS SANDALS',
  'LYCRA': 'LYCRA SHOES',
  'MOULD': 'MOULDS',
  'BOOTIE': 'BOOTIES'
};

const FOOTWEAR_SET = new Set([
  'BALLERINAS', 'BOOTS', 'CANVAS SHOES', 'CASUAL SHOES', 'FASHION SANDALS', 'FLIP FLOPS', 
  'LYCRA SHOES', 'MOULDS', 'SLIDES', 'SPORTS SANDALS', 'SPORTS SHOES', 'BOOTIES'
]);

function normalizeCategoryAndDivision(rawCat, rawDiv) {
  let cat = String(rawCat || '').trim().toUpperCase();
  if (CATEGORY_ALIASES[cat]) {
    cat = CATEGORY_ALIASES[cat];
  }

  let div = String(rawDiv || '').trim().toUpperCase();
  if (FOOTWEAR_SET.has(cat)) {
    div = 'FOOTWEAR';
  } else if (!['FOOTWEAR', 'APPAREL', 'ACCESSORIES'].includes(div)) {
    div = 'APPAREL';
  }

  return { category: cat, division: div };
}


/**
 * Parse date from Dyno row fields:
 * formattedDate ("17 August"), parsedDate (ISO), monthName ("August"), fy ("2026")
 */
function parseDynoRowDate(row) {
  let year = 2026;
  if (row.fy) {
    const py = parseInt(String(row.fy).trim(), 10);
    if (!isNaN(py) && py > 2000) year = py;
  }

  let day = null;
  let monthIdx = null;

  // 1. Try formattedDate (e.g. "17 August", "18 Aug", "05 September")
  if (row.formattedDate) {
    const parts = String(row.formattedDate).trim().split(/\s+/);
    if (parts.length >= 2) {
      const parsedDay = parseInt(parts[0], 10);
      const mStr = parts[1].toLowerCase().slice(0, 3);
      if (!isNaN(parsedDay) && SHORT_MONTH_MAP[mStr] !== undefined) {
        day = parsedDay;
        monthIdx = SHORT_MONTH_MAP[mStr];
      }
    }
  }

  // 2. Try parsedDate (ISO String)
  if ((day === null || monthIdx === null) && row.parsedDate) {
    const d = new Date(row.parsedDate);
    if (!isNaN(d.getTime())) {
      // In IST (UTC + 5:30)
      const istOffsetMs = 5.5 * 60 * 60 * 1000;
      const istDate = new Date(d.getTime() + istOffsetMs);
      day = istDate.getUTCDate();
      monthIdx = istDate.getUTCMonth();
      year = istDate.getUTCFullYear();
    }
  }

  // 3. Try monthName
  if (monthIdx === null && row.monthName) {
    const mStr = String(row.monthName).trim().toLowerCase().slice(0, 3);
    if (SHORT_MONTH_MAP[mStr] !== undefined) {
      monthIdx = SHORT_MONTH_MAP[mStr];
    }
  }

  if (day === null) day = 1;
  if (monthIdx === null) monthIdx = 7; // August default

  const monthName = MONTH_NAMES[monthIdx];
  const formattedMonth = String(monthIdx + 1).padStart(2, '0');
  const formattedDay = String(day).padStart(2, '0');
  const dateKey = `${year}-${formattedMonth}-${formattedDay}`;
  const monthYearKey = `${monthName} ${year}`;

  return { year, monthIdx, monthName, day, dateKey, monthYearKey };
}

let cachedAuthToken = null;
let tokenExpiresAt = 0;

export async function getDynoSupabaseToken() {
  const now = Date.now();
  if (cachedAuthToken && now < tokenExpiresAt - 60000) {
    return cachedAuthToken;
  }

  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });

  const authData = await authRes.json();
  if (!authData.access_token) {
    throw new Error(`Failed to authenticate with Dyno Supabase: ${authData.error_description || authData.message || JSON.stringify(authData)}`);
  }

  cachedAuthToken = authData.access_token;
  tokenExpiresAt = now + (authData.expires_in || 3600) * 1000;
  return cachedAuthToken;
}

let lastSyncState = {
  lastSyncTime: null,
  syncedFilesCount: 0,
    totalRecordsSynced: 0,
  status: 'IDLE',
  error: null
};

let cachedSkuLaunchMap = null;
let launchMapExpiresAt = 0;

async function getSkuLaunchMap(token) {
  const now = Date.now();
  if (cachedSkuLaunchMap && now < launchMapExpiresAt) {
    return cachedSkuLaunchMap;
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/uploaded_files?select=id,name,data&name=eq.[LAUNCH_DATES] SKU Live Dates.xlsx`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${token}`
      }
    });

    const files = await res.json();
    const map = new Map();
    if (Array.isArray(files) && files.length > 0 && Array.isArray(files[0].data)) {
      files[0].data.forEach(r => {
        if (r.sku && r.live_date) {
          map.set(String(r.sku).trim().toUpperCase(), new Date(r.live_date));
        }
      });
    }

    cachedSkuLaunchMap = map;
    launchMapExpiresAt = now + 6 * 60 * 60 * 1000; // Cache for 6 hours
    return map;
  } catch (err) {
    console.warn('[DYNO-SYNC] Warning: Could not fetch launch dates master catalog:', err.message);
    return new Map();
  }
}

export function getDynoSyncStatus() {
  return lastSyncState;
}

/**
 * Fetch and sync Dyno Data with 3 modes:
 * - 'full': Ingests entire historical database (all files)
 * - 'recent': Ingests files uploaded in the last 5 days
 * - 'live': Ingests real-time batches and today's files (< 48 hrs)
 */
export async function fetchAndSyncDynoData(mode = 'full') {
  const startTime = Date.now();
  lastSyncState.status = 'SYNCING';

  try {
    const token = await getDynoSupabaseToken();
    const skuLaunchMap = await getSkuLaunchMap(token);

    let queryUrl = `${SUPABASE_URL}/rest/v1/uploaded_files?select=id,name,upload_date,record_count,data&order=upload_date.desc`;

    if (mode === 'live') {
      queryUrl += `&limit=15`;
    } else if (mode === 'recent') {
      queryUrl += `&limit=35`;
    }

    const filesRes = await fetch(queryUrl, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${token}`
      }
    });

    if (!filesRes.ok) {
      throw new Error(`Supabase API responded with status ${filesRes.status}: ${await filesRes.text()}`);
    }

    const files = await filesRes.json();
    if (!Array.isArray(files)) {
      throw new Error(`Expected array of files, received: ${JSON.stringify(files)}`);
    }

    // Filter to sales files (exclude inventory and launch date reference files)
    let salesFiles = files.filter(f => !f.name.startsWith('[INVENTORY]') && !f.name.startsWith('[LAUNCH_DATES]'));

    if (mode === 'live') {
      // In live mode, only process files uploaded in the last 48 hours or marked as [REALTIME_SYNC]
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      salesFiles = salesFiles.filter(f => f.name.includes('[REALTIME_SYNC]') || f.upload_date >= twoDaysAgo);
    } else if (mode === 'recent') {
      // In recent mode, process files uploaded in the last 5 days
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      salesFiles = salesFiles.filter(f => f.upload_date >= fiveDaysAgo || f.name.includes('[REALTIME_SYNC]'));
    }

    const statMap = new Map(); // key -> stat
    const detectedMonths = new Set();
    let totalRawRows = 0;
    const syncedFileSummaries = [];

    for (const file of salesFiles) {
      const rows = Array.isArray(file.data) ? file.data : [];
      if (rows.length === 0) continue;
      totalRawRows += rows.length;

      syncedFileSummaries.push({
        id: file.id,
        name: file.name,
        uploadDate: file.upload_date,
        recordCount: rows.length
      });

      for (const row of rows) {
        const rawChannel = row.channel_name ?? row.channel ?? row.channelName ?? row.Channel ?? row['Channel Name'] ?? row.marketplace ?? row.Marketplace ?? row.Store ?? row.source;
        const chan = mapDynoChannel(rawChannel);
        if (!chan) continue; // Skip non-marketplace / unmapped channel rows

        const rawCategory = row.categories || row.category || row.Product_Category || '';
        const rawDivision = row.division || row.Department || '';
        const { category, division } = normalizeCategoryAndDivision(rawCategory, rawDivision);
        if (!category || category === 'UNKNOWN') continue;

        const { year, monthName, day, dateKey, monthYearKey } = parseDynoRowDate(row);
        detectedMonths.add(monthYearKey);

        // Check if SKU is a "New Style" (launched in the current financial year >= April 1 of year)
        const skuKey = String(row.item_color || row.itemSku || row.sku || '').trim().toUpperCase();
        const liveDate = skuLaunchMap.get(skuKey);
        const fiscalYearStart = new Date(`${year}-04-01`);

        const isNew = !!(
          row.isNew || 
          row.is_new || 
          (row.New && String(row.New).trim().toUpperCase() !== 'FALSE' && String(row.New).trim() !== '0') ||
          (row['New Style'] && String(row['New Style']).trim().toUpperCase() !== 'FALSE') ||
          (liveDate && liveDate >= fiscalYearStart)
        );

        const key = `${chan.marketplaceId}_${dateKey}_${chan.subChannel || 'MAIN'}_${category}`;

        if (!statMap.has(key)) {
          statMap.set(key, {
            id: key,
            marketplaceId: chan.marketplaceId,
            channelName: chan.subChannel || chan.marketplaceId,
            subChannel: chan.subChannel || undefined,
            dateKey,
            monthYearKey,
            year,
            month: monthName,
            day,
            category,
            division,
            totalUnits: 0,
            newStyleUnits: 0
          });
        }

        const stat = statMap.get(key);
        stat.totalUnits += 1;
        if (isNew) {
          stat.newStyleUnits += 1;
        }
      }
    }

    const aggregatedStats = Array.from(statMap.values());
    const duration = Date.now() - startTime;

    lastSyncState = {
      lastSyncTime: new Date().toISOString(),
      syncedFilesCount: salesFiles.length,
      totalRecordsSynced: totalRawRows,
      status: 'SUCCESS',
      error: null,
      mode,
      durationMs: duration,
      detectedMonths: Array.from(detectedMonths),
      files: syncedFileSummaries
    };

    console.log(`[DYNO-SYNC] [Mode: ${mode}] Synced ${salesFiles.length} files (${totalRawRows} raw rows -> ${aggregatedStats.length} daily category stats) in ${duration}ms.`);

    return {
      success: true,
      stats: aggregatedStats,
      mode,
      months: Array.from(detectedMonths),
      summary: lastSyncState
    };

  } catch (err) {
    console.error('[DYNO-SYNC] Error syncing data from Dyno Supabase:', err);
    lastSyncState = {
      ...lastSyncState,
      status: 'ERROR',
      error: err.message
    };
    return {
      success: false,
      error: err.message
    };
  }
}
