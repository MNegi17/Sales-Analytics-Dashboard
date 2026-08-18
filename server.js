import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { 
  initDb, 
  getDailyStats, 
  saveDailyStats, 
  getUploadLogs, 
  saveUploadLog,
  deleteUploadLogAndStats, 
  getStyleCounts, 
  setStyleCount, 
  getCustomMonths, 
  addCustomMonth, 
  resetAllDbData,
  isPostgres 
} from './server/db.js';
import { 
  fetchAndSyncDynoData, 
  getDynoSyncStatus 
} from './server/dyno-sync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Dyno Dashboard Supabase Real-Time Sync API
app.get('/api/dyno/status', (req, res) => {
  res.json({ success: true, status: getDynoSyncStatus() });
});

app.post('/api/dyno/sync', async (req, res) => {
  try {
    const mode = req.body?.mode || 'full'; // 'live', 'recent', 'full'
    const syncResult = await fetchAndSyncDynoData(mode);
    if (!syncResult.success) {
      return res.status(500).json({ success: false, error: syncResult.error });
    }

    // Save synced stats to DB
    if (mode === 'full') {
      await saveDailyStats(syncResult.stats, 'full-replace');
    } else {
      await saveDailyStats(syncResult.stats, 'replace');
    }
    
    // Also save custom months
    for (const m of syncResult.months) {
      await addCustomMonth(m);
    }

    // Save summary audit log
    if (syncResult.summary) {
      const modeLabel = mode === 'live' ? 'Live Real-Time' : (mode === 'recent' ? 'Recent (5 Days)' : 'Full Database');
      const logEntry = {
        id: `DYNO-SYNC-${Date.now()}`,
        fileName: `[Dyno ${modeLabel} Sync] ${syncResult.summary.syncedFilesCount} Files`,
        uploadTimestamp: new Date().toLocaleString(),
        dateRange: syncResult.months.join(', '),
        marketplacesDetected: ['myntra', 'amazon', 'ajio', 'nykaa', 'firstcry', 'flipkart', 'd2c'],
        rowsProcessed: syncResult.summary.totalRecordsSynced,
        rowsInserted: syncResult.stats.length,
        rowsUpdated: 0,
        rowsSkipped: 0,
        duplicateCount: 0,
        errorCount: 0,
        processingTimeMs: syncResult.summary.durationMs || 0,
        status: 'SUCCESS',
        errors: []
      };
      await saveUploadLog(logEntry);
    }

    // Return the full consolidated daily stats from DB
    const allStats = await getDailyStats();

    res.json({
      success: true,
      stats: allStats,
      mode,
      months: syncResult.months,
      summary: syncResult.summary
    });
  } catch (err) {
    console.error('[API] Dyno sync error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    postgres: isPostgres 
  });
});

// Daily Stats API
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await getDailyStats();
    res.json({ success: true, stats });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/stats/batch', async (req, res) => {
  try {
    const { stats, resolution, log } = req.body;
    if (!Array.isArray(stats)) {
      return res.status(400).json({ success: false, error: 'Invalid stats payload' });
    }
    await saveDailyStats(stats, resolution || 'replace');
    if (log) {
      await saveUploadLog(log);
    }
    res.json({ success: true, count: stats.length });
  } catch (err) {
    console.error('Error saving batch stats:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Upload Audit Logs API
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await getUploadLogs();
    res.json({ success: true, logs });
  } catch (err) {
    console.error('Error fetching upload logs:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/logs', async (req, res) => {
  try {
    const log = req.body;
    await saveUploadLog(log);
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving upload log:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteUploadLogAndStats(id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting upload log:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Style Counts API
app.get('/api/style-counts', async (req, res) => {
  try {
    const counts = await getStyleCounts();
    res.json({ success: true, counts });
  } catch (err) {
    console.error('Error fetching style counts:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/style-counts', async (req, res) => {
  try {
    const { category, count } = req.body;
    if (!category) return res.status(400).json({ success: false, error: 'Category is required' });
    await setStyleCount(category, count);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating style count:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Custom Months API
app.get('/api/months', async (req, res) => {
  try {
    const months = await getCustomMonths();
    res.json({ success: true, months });
  } catch (err) {
    console.error('Error fetching custom months:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/months', async (req, res) => {
  try {
    const { monthYear } = req.body;
    if (!monthYear) return res.status(400).json({ success: false, error: 'Month/Year is required' });
    await addCustomMonth(monthYear);
    res.json({ success: true });
  } catch (err) {
    console.error('Error adding custom month:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reset API
app.post('/api/reset', async (req, res) => {
  try {
    await resetAllDbData();
    res.json({ success: true });
  } catch (err) {
    console.error('Error resetting data:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Static assets & SPA fallback
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start Server
async function startServer() {
  await initDb();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Sales Analytics Server running on port ${PORT}`);
  });

  // Automatically trigger initial background sync from Dyno Supabase
  fetchAndSyncDynoData()
    .then(async (syncResult) => {
      if (syncResult.success) {
        await saveDailyStats(syncResult.stats, 'full-replace');
        for (const m of syncResult.months) {
          await addCustomMonth(m);
        }
        console.log(`[SERVER] Initial Dyno DB sync complete (${syncResult.stats.length} daily stats loaded).`);
      }
    })
    .catch(err => console.error('[SERVER] Initial Dyno DB sync warning:', err.message));
}

startServer();
