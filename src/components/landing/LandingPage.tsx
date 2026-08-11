import React from 'react';
import { BarChart3, ShieldCheck, Zap, Table, Calendar, Sparkles, ArrowRight, Layers, CheckCircle2, Lock, LucideIcon } from 'lucide-react';

interface LandingPageProps {
  onOpenAdmin: () => void;
  onViewDashboard: () => void;
}

interface FeatureItem {
  icon: LucideIcon;
  iconBg: string;
  title: string;
  description: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAdmin,
  onViewDashboard
}) => {
  const marketplaces = [
    { name: 'Myntra + SJIT', type: 'Structure A', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    { name: 'Amazon + Cocoblu + FBA', type: 'Structure A', color: 'bg-amber-50 text-amber-800 border-amber-200' },
    { name: 'Ajio', type: 'Structure B', color: 'bg-blue-50 text-blue-800 border-blue-200' },
    { name: 'Nykaa', type: 'Structure B', color: 'bg-pink-50 text-pink-800 border-pink-200' },
    { name: 'FirstCry', type: 'Structure B', color: 'bg-purple-50 text-purple-800 border-purple-200' },
    { name: 'Flipkart', type: 'Structure B', color: 'bg-sky-50 text-sky-800 border-sky-200' },
    { name: 'D2C (Shopify)', type: 'Structure B', color: 'bg-slate-100 text-slate-800 border-slate-300' },
  ];

  const features: FeatureItem[] = [
    {
      icon: Zap,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
      title: 'Zero Manual Ingestion',
      description: 'Eliminates hours of tedious row-by-row Excel entry. Automatically parses raw order files into aggregated channel sheets.'
    },
    {
      icon: Table,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      title: 'Exact Excel Sheet Replica',
      description: 'Reproduces Structure A (Myntra/Amazon subchannels) & Structure B layouts with authentic Microsoft Excel header fills.'
    },
    {
      icon: Lock,
      iconBg: 'bg-sky-50 text-sky-600 border-sky-200',
      title: 'Strict Sticky Freeze Panes',
      description: 'Category, Online Style Count, and Division columns remain frozen on horizontal scroll with shadow dividers.'
    },
    {
      icon: Calendar,
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      title: 'Real Calendar Alignment',
      description: 'Automatically calculates real-world calendar day-of-week headers (e.g. Saturday for Aug 1, Wednesday for Jul 1).'
    },
    {
      icon: Layers,
      iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
      title: 'Monthly & New Contribution',
      description: 'Maintains full Monthly Sales Sheet alongside a dedicated New Contribution Sheet filtered from the "New" column.'
    },
    {
      icon: ShieldCheck,
      iconBg: 'bg-teal-50 text-teal-600 border-teal-200',
      title: 'Conflict Resolution & Audit',
      description: 'Protects data integrity by detecting overlapping uploads and offering instant Replace, Merge, or Skip options.'
    }
  ];

  return (
    <div className="space-y-10 pb-12">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-white rounded-3xl p-6 sm:p-10 lg:p-12 border border-slate-200 shadow-sm text-center">
        {/* Subtle decorative backdrop glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-sky-100/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-100/60 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto space-y-6">
          
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse" />
            <span>Multi-Marketplace Sales Analytics Engine</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight sm:leading-none">
            Automated Sales Processing &amp; Analytics
          </h1>

          {/* Sub-headline */}
          <p className="max-w-2xl mx-auto text-sm sm:text-base lg:text-lg text-slate-600 font-normal leading-relaxed">
            Real-time analytics engine for aggregating, viewing, and exporting multi-marketplace sales sheets with full data integrity.
          </p>

          {/* Supported Marketplaces Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {marketplaces.map((mp, idx) => (
              <span
                key={idx}
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-transform hover:scale-105 ${mp.color}`}
              >
                {mp.name}
              </span>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <button
              onClick={onViewDashboard}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 group"
            >
              <BarChart3 className="w-4 h-4 text-white" />
              <span>Explore Sales Dashboard</span>
              <ArrowRight className="w-4 h-4 text-sky-200 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onOpenAdmin}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md border border-slate-700 transition-all flex items-center justify-center space-x-2"
            >
              <Lock className="w-4 h-4 text-sky-400" />
              <span>Admin Data Portal</span>
            </button>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS WORKFLOW */}
      <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Simple 3-Step Workflow</h2>
          <p className="text-xs sm:text-sm text-slate-500">From raw Excel order reports to production analytics in seconds</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 relative">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white font-black text-xs flex items-center justify-center">
              1
            </div>
            <h3 className="font-bold text-sm text-slate-900">Admin File Ingestion</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Authorized admin ingests raw sales orders Excel files containing date, channel name, category, and sales quantities.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 relative">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white font-black text-xs flex items-center justify-center">
              2
            </div>
            <h3 className="font-bold text-sm text-slate-900">Automated DB Sync</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              The engine validates rows, maps channels to marketplaces, calculates daily totals, and persists data to PostgreSQL.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 relative">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white font-black text-xs flex items-center justify-center">
              3
            </div>
            <h3 className="font-bold text-sm text-slate-900">Public Real-Time Export</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Explore exact spreadsheet layouts with frozen panes, toggle sub-channel totals, and download complete `.xlsx` workbooks anytime.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURE HIGHLIGHTS */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Platform Capabilities</h2>
            <p className="text-xs text-slate-500">Engineered for speed, accuracy, and operational clarity</p>
          </div>
          <span className="hidden sm:inline-flex items-center space-x-1 text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Excel 1:1 Parity</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const IconComp = feat.icon;
            return (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3">
                <div className={`w-10 h-10 rounded-xl ${feat.iconBg} border flex items-center justify-center`}>
                  <IconComp className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">{feat.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* BOTTOM FOOTER SUMMARY */}
      <section className="bg-gradient-to-r from-slate-900 to-sky-950 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="font-bold text-base text-white flex items-center justify-center sm:justify-start space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Real-time Sales Analytics Engine</span>
          </h3>
          <p className="text-xs text-slate-300">Browse aggregated sales performance or download identical Excel workbooks.</p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-center">
          <button
            onClick={onViewDashboard}
            className="px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-sm transition-all"
          >
            Open Sales Dashboard
          </button>
          <button
            onClick={onOpenAdmin}
            className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center space-x-1.5"
          >
            <Lock className="w-3.5 h-3.5 text-sky-400" />
            <span>Admin Login</span>
          </button>
        </div>
      </section>

    </div>
  );
};
