import React from 'react';
import { 
  ShoppingBag, 
  Calendar, 
  Layers, 
  FileCheck, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { DashboardMetrics } from '../../types';

interface MetricsCardsProps {
  metrics: DashboardMetrics;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ metrics }) => {
  const cards = [
    {
      title: "Today's Sales",
      value: metrics.todaysSales.toLocaleString(),
      subtitle: "Units processed today",
      icon: ShoppingBag,
      color: "text-brand-400",
      bg: "bg-brand-500/10 border-brand-500/20"
    },
    {
      title: "Monthly Sales",
      value: metrics.monthlySales.toLocaleString(),
      subtitle: "Units total for selected month",
      icon: Calendar,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20"
    },
    {
      title: "Categories Updated",
      value: metrics.categoriesUpdated.toString(),
      subtitle: "Active product categories",
      icon: Layers,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20"
    },
    {
      title: "Files Uploaded",
      value: metrics.filesUploaded.toString(),
      subtitle: "Total batches processed",
      icon: FileCheck,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20"
    },
    {
      title: "Latest Upload",
      value: metrics.latestUploadTime,
      subtitle: "Last pipeline execution",
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20"
    },
    {
      title: "Pending Categories",
      value: metrics.pendingCategoriesCount.toString(),
      subtitle: "Categories awaiting sales data",
      icon: AlertCircle,
      color: metrics.pendingCategoriesCount > 0 ? "text-rose-400" : "text-slate-400",
      bg: metrics.pendingCategoriesCount > 0 ? "bg-rose-500/10 border-rose-500/20" : "bg-slate-800 border-slate-700"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((c, i) => (
        <div key={i} className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{c.title}</span>
            <div className={`p-2 rounded-xl border ${c.bg}`}>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white tracking-tight">{c.value}</div>
            <div className="text-xs text-slate-400 mt-1 truncate">{c.subtitle}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
