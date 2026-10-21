import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { AlertBanner } from './components/AlertBanner';
import { Dashboard } from './components/Dashboard';
import { Plantations } from './components/Plantations';
import { Workers } from './components/Workers';
import { Ledger } from './components/Ledger';
import { ExcelHub } from './components/ExcelHub';
import { SettingsView } from './components/SettingsView';
import { AdminManagement } from './components/AdminManagement';
import { LoginScreen } from './components/LoginScreen';
import { AddPineappleModal } from './components/AddPineappleModal';
import { MarkNourishModal } from './components/MarkNourishModal';
import { PineappleDetailModal } from './components/PineappleDetailModal';
import { AddWorkerModal } from './components/AddWorkerModal';
import { RecordPaymentModal } from './components/RecordPaymentModal';
import { WorkerDetailModal } from './components/WorkerDetailModal';
import { SlotConfirmationPopup } from './components/SlotConfirmationPopup';

const MainLayout: React.FC = () => {
  const { currentTab, toast, isSuperAdmin } = useApp();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans pb-16 md:pb-8">
      {/* Top Navbar */}
      <Navbar />

      {/* Overdue/Due Banner if any */}
      <AlertBanner />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-5">
        {currentTab === 'dashboard' && <Dashboard />}
        {currentTab === 'plantations' && <Plantations />}
        {currentTab === 'workers' && <Workers />}
        {currentTab === 'ledger' && <Ledger />}
        {currentTab === 'excel' && <ExcelHub />}
        {currentTab === 'settings' && <SettingsView />}
        {currentTab === 'admins' && (isSuperAdmin ? <AdminManagement /> : <Dashboard />)}
      </main>

      {/* Global Modals */}
      <AddPineappleModal />
      <MarkNourishModal />
      <PineappleDetailModal />
      <AddWorkerModal />
      <RecordPaymentModal />
      <WorkerDetailModal />
      <SlotConfirmationPopup />

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Clean, Simple Toast */}
      {toast && (
        <div className="fixed bottom-16 md:bottom-5 right-4 z-50">
          <div className="px-3.5 py-2 rounded-lg shadow-md bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium border border-zinc-700/50 dark:border-zinc-300">
            {toast.text}
          </div>
        </div>
      )}
    </div>
  );
};

const AuthGate: React.FC = () => {
  const { currentUser } = useApp();

  if (!currentUser) {
    return <LoginScreen />;
  }

  return <MainLayout />;
};

export default function App() {
  return (
    <AppProvider>
      <AuthGate />
    </AppProvider>
  );
}
