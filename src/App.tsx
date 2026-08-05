import React, { useState } from 'react';
import { Navbar, ActiveTab } from './components/layout/Navbar';
import { LandingPage } from './components/landing/LandingPage';
import { ExcelSheetView } from './components/dashboard/ExcelSheetView';
import { UploadModal } from './components/upload/UploadModal';
import { MyntraStyleEditor } from './components/myntra/MyntraStyleEditor';
import { ExportModule } from './components/export/ExportModule';
import { UploadHistoryTable } from './components/history/UploadHistoryTable';
import { useSalesStore } from './store/useSalesStore';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const { 
    dailyStats, 
    myntraStyleCounts,
    selectedMonthYear, 
    setSelectedMonthYear,
  } = useSalesStore();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUploadModal={() => setIsUploadOpen(false)}
        totalRecordsCount={dailyStats.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {activeTab === 'landing' && (
          <LandingPage
            onStartUpload={() => setIsUploadOpen(true)}
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

        {activeTab === 'history' && (
          <UploadHistoryTable />
        )}

      </main>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />

    </div>
  );
}
