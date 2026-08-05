import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { DailyCategoryStat, MarketplaceId } from '../../types';
import { MARKETPLACE_CONFIGS } from '../../engine/constants';

interface AnalyticsChartsProps {
  stats: DailyCategoryStat[];
}

const COLORS = ['#f43f5e', '#f59e0b', '#3b82f6', '#ec4899', '#10b981', '#eab308', '#a855f7'];

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ stats }) => {

  // 1. Prepare Daily Trend Data
  const dateMap = new Map<string, Record<string, number>>();
  stats.forEach(s => {
    if (!dateMap.has(s.dateKey)) {
      dateMap.set(s.dateKey, { total: 0, myntra: 0, amazon: 0, ajio: 0, nykaa: 0, firstcry: 0, flipkart: 0, d2c: 0 });
    }
    const rec = dateMap.get(s.dateKey)!;
    rec.total += s.totalUnits;
    rec[s.marketplaceId] = (rec[s.marketplaceId] || 0) + s.totalUnits;
  });

  const dailyTrendData = Array.from(dateMap.entries())
    .map(([date, val]) => ({ date, ...val }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 2. Prepare Marketplace Share Data
  const mpMap = new Map<MarketplaceId, number>();
  stats.forEach(s => {
    mpMap.set(s.marketplaceId, (mpMap.get(s.marketplaceId) || 0) + s.totalUnits);
  });

  const mpShareData = Array.from(mpMap.entries()).map(([id, value]) => ({
    name: MARKETPLACE_CONFIGS[id]?.name || id,
    value
  }));

  // 3. Prepare Top Categories Data
  const catMap = new Map<string, number>();
  stats.forEach(s => {
    catMap.set(s.category, (catMap.get(s.category) || 0) + s.totalUnits);
  });

  const topCategoriesData = Array.from(catMap.entries())
    .map(([category, units]) => ({ category, units }))
    .sort((a, b) => b.units - a.units)
    .slice(0, 8);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Chart 1: Daily Sales Trend */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h3 className="text-base font-bold text-white mb-4">Daily Sales Trend (Units)</h3>
        <div className="h-72 w-full">
          {dailyTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrendData}>
                <defs>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0c94e8" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0c94e8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#38bdf8' }}
                />
                <Area type="monotone" dataKey="total" stroke="#0c94e8" strokeWidth={2} fillOpacity={1} fill="url(#totalGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              No sales data uploaded for current filter
            </div>
          )}
        </div>
      </div>

      {/* Chart 2: Marketplace Contribution */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h3 className="text-base font-bold text-white mb-4">Marketplace Contribution</h3>
        <div className="h-72 w-full">
          {mpShareData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mpShareData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {mpShareData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              No marketplace stats available
            </div>
          )}
        </div>
      </div>

      {/* Chart 3: Top Category Distribution */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 lg:col-span-2">
        <h3 className="text-base font-bold text-white mb-4">Top 8 Category Performance</h3>
        <div className="h-72 w-full">
          {topCategoriesData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCategoriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="category" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Bar dataKey="units" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              Upload sales file to view category breakdown
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
