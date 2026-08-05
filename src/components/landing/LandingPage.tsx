import React from 'react';

interface LandingPageProps {
  onStartUpload: () => void;
  onViewDashboard: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartUpload,
  onViewDashboard
}) => {
  return (
    <div className="space-y-10 pb-12">
      
      {/* HERO SECTION */}
      <section className="pt-8 text-center bg-white rounded-2xl p-10 border border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold uppercase tracking-wider">
            Production-Grade Sales Ingestion Pipeline
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Automated Multi-Marketplace Sales Processing
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            Upload ONE sales report file to automatically process, aggregate, and generate identical Excel sheets across all 7 marketplaces: <strong className="text-slate-900">Myntra, Amazon, Ajio, Nykaa, FirstCry, Flipkart, &amp; D2C</strong>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={onStartUpload}
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              Upload Sales File Now
            </button>

            <button
              onClick={onViewDashboard}
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 transition-all"
            >
              Open Sales Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* VALUE CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <h3 className="text-base font-bold text-slate-900">Zero Manual Sheet Ingestion</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Eliminates hours of daily row-by-row data entry into individual marketplace sheets.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <h3 className="text-base font-bold text-slate-900">Exact Sheet Formats</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Reproduces Structure A (Myntra/Amazon subchannels) &amp; Structure B (Ajio/Nykaa/Flipkart/D2C) layouts.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <h3 className="text-base font-bold text-slate-900">Monthly Sales &amp; New Contribution</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Maintains full Monthly Sales Sheet alongside dedicated New Contribution Sheet for newly launched styles.
          </p>
        </div>
      </section>

    </div>
  );
};
