import pkg from 'pg';
const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
let pool = null;

export function getCurrentISTMonthYear() {
  const now = new Date();
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    month: 'long',
    year: 'numeric'
  }).format(now);
}

export function getDefaultMonths() {
  const current = getCurrentISTMonthYear();
  const base = ['May 2026', 'June 2026', 'July 2026', 'August 2026', 'September 2026'];
  if (!base.includes(current)) base.push(current);
  return base;
}

// Memory storage fallback when PostgreSQL connection string is not present
const inMemoryDb = {
  dailyStats: [],
  uploadLogs: [],
  styleCounts: {},
  customMonths: getDefaultMonths()
};

export const isPostgres = !!connectionString;

if (isPostgres) {
  console.log('[DB] Connecting to PostgreSQL instance...');
  pool = new Pool({
    connectionString,
    ssl: false,
    connectionTimeoutMillis: 10000
  });
}

export async function initDb() {
  if (!isPostgres) {
    console.log('[DB] Using in-memory data store (Local Mode)');
    return;
  }

  console.log('[DB] Initializing PostgreSQL database tables...');
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS daily_stats (
          id VARCHAR(255) PRIMARY KEY,
          marketplace_id VARCHAR(100) NOT NULL,
          sub_channel VARCHAR(100),
          category VARCHAR(255) NOT NULL,
          division VARCHAR(100) NOT NULL,
          date_key VARCHAR(50) NOT NULL,
          day_of_week VARCHAR(50),
          date_num INT,
          month_year_key VARCHAR(100) NOT NULL,
          year INT,
          month VARCHAR(50),
          total_units INT DEFAULT 0,
          new_style_units INT DEFAULT 0,
          is_weekend BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS upload_logs (
          id VARCHAR(255) PRIMARY KEY,
          file_name VARCHAR(255) NOT NULL,
          upload_timestamp VARCHAR(100) NOT NULL,
          date_range VARCHAR(100),
          marketplaces_detected TEXT,
          rows_processed INT DEFAULT 0,
          rows_inserted INT DEFAULT 0,
          rows_updated INT DEFAULT 0,
          rows_skipped INT DEFAULT 0,
          duplicate_count INT DEFAULT 0,
          error_count INT DEFAULT 0,
          processing_time_ms INT DEFAULT 0,
          status VARCHAR(50) NOT NULL,
          errors TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS style_counts (
          category VARCHAR(255) PRIMARY KEY,
          count INT NOT NULL DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS custom_months (
          month_year VARCHAR(100) PRIMARY KEY,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('[DB] PostgreSQL tables ready.');
    } catch (err) {
      console.error('[DB] Error initializing PostgreSQL tables:', err);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[DB] Failed to connect to PostgreSQL:', err);
  }
}

// Queries for Daily Stats
export async function getDailyStats() {
  if (!isPostgres) return inMemoryDb.dailyStats;
  const res = await pool.query('SELECT * FROM daily_stats ORDER BY created_at ASC');
  return res.rows.map(r => ({
    id: r.id,
    marketplaceId: r.marketplace_id,
    channelName: r.sub_channel || r.marketplace_id,
    subChannel: r.sub_channel || undefined,
    dateKey: r.date_key,
    monthYearKey: r.month_year_key,
    year: r.year || (r.date_key ? parseInt(r.date_key.split('-')[0]) : 2026),
    month: r.month || (r.month_year_key ? r.month_year_key.split(' ')[0] : 'September'),
    day: r.date_num || (r.date_key ? parseInt(r.date_key.split('-')[2]) : 1),
    category: r.category,
    division: r.division,
    totalUnits: r.total_units,
    newStyleUnits: r.new_style_units,
    isWeekend: r.is_weekend
  }));
}

export async function saveDailyStats(stats, resolution = 'replace') {
  if (!isPostgres) {
    if (resolution === 'full-replace') {
      inMemoryDb.dailyStats = [...stats];
    } else if (resolution === 'replace') {
      const keysToReplace = new Set(stats.map(s => `${s.marketplaceId}_${s.dateKey}_${s.subChannel || ''}_${s.category}`));
      inMemoryDb.dailyStats = inMemoryDb.dailyStats.filter(s => !keysToReplace.has(`${s.marketplaceId}_${s.dateKey}_${s.subChannel || ''}_${s.category}`));
      inMemoryDb.dailyStats.push(...stats);
    } else if (resolution === 'merge') {
      const map = new Map(inMemoryDb.dailyStats.map(s => [`${s.marketplaceId}_${s.dateKey}_${s.subChannel || ''}_${s.category}`, s]));
      stats.forEach(s => {
        const k = `${s.marketplaceId}_${s.dateKey}_${s.subChannel || ''}_${s.category}`;
        if (map.has(k)) {
          const ex = map.get(k);
          ex.totalUnits += s.totalUnits;
          ex.newStyleUnits += s.newStyleUnits;
        } else {
          map.set(k, { ...s });
        }
      });
      inMemoryDb.dailyStats = Array.from(map.values());
    } else {
      inMemoryDb.dailyStats.push(...stats);
    }
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (resolution === 'full-replace') {
      await client.query('TRUNCATE TABLE daily_stats RESTART IDENTITY');
    }

    for (const s of stats) {
      const statId = s.id || `${s.marketplaceId}_${s.dateKey}_${s.subChannel || 'MAIN'}_${s.category}`;
      const dateNum = s.day || (s.dateKey ? parseInt(s.dateKey.split('-')[2]) : 1);
      const yearNum = s.year || (s.dateKey ? parseInt(s.dateKey.split('-')[0]) : 2026);

      if (resolution === 'merge') {
        await client.query(
          `INSERT INTO daily_stats 
            (id, marketplace_id, sub_channel, category, division, date_key, day_of_week, date_num, month_year_key, year, month, total_units, new_style_units, is_weekend)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (id) DO UPDATE SET
            total_units = daily_stats.total_units + EXCLUDED.total_units,
            new_style_units = daily_stats.new_style_units + EXCLUDED.new_style_units`,
          [
            statId, s.marketplaceId, s.subChannel || null, s.category, s.division || 'APPAREL', s.dateKey, s.dayOfWeek || '', dateNum, s.monthYearKey, yearNum, s.month || '', s.totalUnits || 0, s.newStyleUnits || 0, s.isWeekend || false
          ]
        );
      } else {
        await client.query(
          `INSERT INTO daily_stats 
            (id, marketplace_id, sub_channel, category, division, date_key, day_of_week, date_num, month_year_key, year, month, total_units, new_style_units, is_weekend)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (id) DO UPDATE SET
            total_units = EXCLUDED.total_units,
            new_style_units = EXCLUDED.new_style_units`,
          [
            statId, s.marketplaceId, s.subChannel || null, s.category, s.division || 'APPAREL', s.dateKey, s.dayOfWeek || '', dateNum, s.monthYearKey, yearNum, s.month || '', s.totalUnits || 0, s.newStyleUnits || 0, s.isWeekend || false
          ]
        );
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Queries for Upload Logs
export async function getUploadLogs() {
  if (!isPostgres) return inMemoryDb.uploadLogs;
  const res = await pool.query('SELECT * FROM upload_logs ORDER BY created_at DESC');
  return res.rows.map(r => ({
    id: r.id,
    fileName: r.file_name,
    uploadTimestamp: r.upload_timestamp,
    dateRange: r.date_range,
    marketplacesDetected: r.marketplaces_detected ? JSON.parse(r.marketplaces_detected) : [],
    rowsProcessed: r.rows_processed,
    rowsInserted: r.rows_inserted,
    rowsUpdated: r.rows_updated,
    rowsSkipped: r.rows_skipped,
    duplicateCount: r.duplicate_count,
    errorCount: r.error_count,
    processingTimeMs: r.processing_time_ms,
    status: r.status,
    errors: r.errors ? JSON.parse(r.errors) : []
  }));
}

export async function saveUploadLog(log) {
  if (!isPostgres) {
    inMemoryDb.uploadLogs.unshift(log);
    return;
  }

  await pool.query(
    `INSERT INTO upload_logs 
      (id, file_name, upload_timestamp, date_range, marketplaces_detected, rows_processed, rows_inserted, rows_updated, rows_skipped, duplicate_count, error_count, processing_time_ms, status, errors)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, rows_inserted = EXCLUDED.rows_inserted, rows_updated = EXCLUDED.rows_updated, rows_skipped = EXCLUDED.rows_skipped`,
    [
      log.id,
      log.fileName,
      log.uploadTimestamp,
      log.dateRange,
      JSON.stringify(log.marketplacesDetected || []),
      log.rowsProcessed || 0,
      log.rowsInserted || 0,
      log.rowsUpdated || 0,
      log.rowsSkipped || 0,
      log.duplicateCount || 0,
      log.errorCount || 0,
      log.processingTimeMs || 0,
      log.status,
      JSON.stringify(log.errors || [])
    ]
  );
}

export async function deleteUploadLogAndStats(logId) {
  if (!isPostgres) {
    inMemoryDb.uploadLogs = inMemoryDb.uploadLogs.filter(l => l.id !== logId);
    return;
  }

  await pool.query('DELETE FROM upload_logs WHERE id = $1', [logId]);
}

// Queries for Style Counts
export async function getStyleCounts() {
  if (!isPostgres) return inMemoryDb.styleCounts;
  const res = await pool.query('SELECT category, count FROM style_counts');
  const counts = {};
  res.rows.forEach(r => { counts[r.category] = r.count; });
  return counts;
}

export async function setStyleCount(category, count) {
  if (!isPostgres) {
    inMemoryDb.styleCounts[category] = count;
    return;
  }

  await pool.query(
    `INSERT INTO style_counts (category, count) VALUES ($1, $2)
     ON CONFLICT (category) DO UPDATE SET count = EXCLUDED.count, updated_at = CURRENT_TIMESTAMP`,
    [category, count]
  );
}

// Queries for Custom Months
export async function getCustomMonths() {
  const defaultMonths = getDefaultMonths();
  if (!isPostgres) {
    return Array.from(new Set([...defaultMonths, ...inMemoryDb.customMonths]));
  }
  const res = await pool.query('SELECT month_year FROM custom_months ORDER BY created_at ASC');
  const dbMonths = res.rows.map(r => r.month_year);
  return Array.from(new Set([...defaultMonths, ...dbMonths]));
}

export async function addCustomMonth(monthYear) {
  if (!isPostgres) {
    if (!inMemoryDb.customMonths.includes(monthYear)) {
      inMemoryDb.customMonths.push(monthYear);
    }
    return;
  }

  await pool.query(
    `INSERT INTO custom_months (month_year) VALUES ($1) ON CONFLICT (month_year) DO NOTHING`,
    [monthYear]
  );
}

export async function resetAllDbData() {
  if (!isPostgres) {
    inMemoryDb.dailyStats = [];
    inMemoryDb.uploadLogs = [];
    inMemoryDb.styleCounts = {};
    inMemoryDb.customMonths = getDefaultMonths();
    return;
  }

  await pool.query('TRUNCATE TABLE daily_stats, upload_logs, style_counts, custom_months');
}
