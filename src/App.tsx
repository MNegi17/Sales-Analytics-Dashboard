import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/layout/Navbar';
import { LandingPage } from './components/landing/LandingPage';
import { ExcelSheetView } from './components/dashboard/ExcelSheetView';
import { MyntraStyleEditor } from './components/myntra/MyntraStyleEditor';
import { ExportModule } from './components/export/ExportModule';
import { AdminPortal } from './components/admin/AdminPortal';
import { useSalesStore } from './store/useSalesStore';

export function App() {
  // Default to Overview ('landing') page on open
  const [activeTab, setActiveTab] = useState<ActiveTab>('landing');

  const { 
    dailyStats, 
    myntraStyleCounts,
    selectedMonthYear, 
    setSelectedMonthYear,
    fetchInitialData
  } = useSalesStore();

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalRecordsCount={dailyStats.length}
      />

      {/* Main Content Area */}
      <main className={`flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 ${activeTab === 'dashboard' ? 'pt-2 pb-6' : 'py-6'}`}>
        
        {activeTab === 'landing' && (
          <LandingPage
            onOpenAdmin={() => setActiveTab('admin')}
            onViewDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'dashboard' && (
          <ExcelSheetView
            stats={dailyStats}
            myntraStyleCounts={myntraStyleCounts}
            selectedMonthYear={selectedMonthYear}
            onMonthChange={setSelectedMonthYear}
          />
        )}

        {activeTab === 'myntra-editor' && (
          <MyntraStyleEditor />
        )}

        {activeTab === 'export' && (
          <ExportModule />
        )}

        {activeTab === 'admin' && (
          <AdminPortal />
        )}

      </main>

    </div>
  );
}
